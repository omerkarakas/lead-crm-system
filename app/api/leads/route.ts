import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Lead } from '@/types/lead';
import type { CreateLeadDto } from '@/types/lead';
import { fetchActiveQuestions } from '@/lib/api/qa';
import { formatPollMessage as formatWhatsAppPollMessage } from '@/lib/whatsapp/message-formatter';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';

/**
 * GET /api/leads - Get all leads with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || '-created';

    const filterParts: string[] = [];

    // Search filter (name, phone, or email)
    if (search) {
      filterParts.push(`name ~ "${search}" || phone ~ "${search}" || email ~ "${search}"`);
    }

    // Status filter
    if (status) {
      filterParts.push(`status = "${status}"`);
    }

    // Tags filter (any of the provided tags)
    if (tags.length > 0) {
      const tagFilters = tags.map(tag => `tags ~ "${tag}"`);
      filterParts.push(`(${tagFilters.join(' || ')})`);
    }

    const options: any = { sort };

    // Only add filter if it exists
    if (filterParts.length > 0) {
      options.filter = filterParts.join(' && ');
    }

    const response = await pb.collection<Lead>('leads').getList(page, perPage, options);

    return NextResponse.json({
      page: response.page,
      perPage: response.perPage,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      items: response.items,
    });
  } catch (error) {
    console.error('[GET /api/leads] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leads',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Create or update lead helper function
 * Consolidates duplicate detection and handling logic for use across public form and webhooks
 *
 * @param data - Lead creation data with optional UTM params
 * @param pb - Optional PocketBase instance (creates own if not provided)
 * @returns Object with lead and action ('created' | 'updated')
 */
export async function createOrUpdateLead(
  data: CreateLeadDto & {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    utm_timestamp?: string;
  },
  pb?: any
): Promise<{ lead: Lead; action: 'created' | 'updated' }> {
  const pocketbase = pb || await getServerPb();
  const userId = pocketbase.authStore.model?.id;

  // Extract UTM parameters
  const utmParams = {
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_content: data.utm_content,
    utm_term: data.utm_term,
    utm_timestamp: data.utm_timestamp,
  };

  // Check if any UTM params are present, add timestamp if not provided
  const hasUtmParams = Object.values(utmParams).some(v => v !== undefined && v !== '');
  if (hasUtmParams && !utmParams.utm_timestamp) {
    utmParams.utm_timestamp = new Date().toISOString();
  }

  // Check for duplicate lead (by phone OR email)
  let duplicateLead: Lead | null = null;
  const filterParts: string[] = [];

  if (data.phone) {
    filterParts.push(`phone = "${data.phone}"`);
  }
  if (data.email) {
    filterParts.push(`email = "${data.email}"`);
  }

  if (filterParts.length > 0) {
    try {
      const duplicates = await pocketbase.collection('leads').getList(1, 1, {
        filter: filterParts.join(' || '),
      });
      if (duplicates.items.length > 0) {
        duplicateLead = duplicates.items[0] as Lead;
      }
    } catch (error) {
      console.error('[createOrUpdateLead] Error checking duplicates:', error);
    }
  }

  let lead: Lead;

  if (duplicateLead) {
    // Handle duplicate - update existing lead
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Store old values in message field
    const oldValuesNote = `TEKRAR BASVURU [${dateStr}]: Eski değerler - name: ${duplicateLead.name}, phone: ${duplicateLead.phone}, email: ${duplicateLead.email || ''}, company: ${duplicateLead.company || ''}`;
    const existingNotes = duplicateLead.message || '';
    const updatedNotes = existingNotes ? `${existingNotes}\n\n${oldValuesNote}` : oldValuesNote;

    // Prepare update data
    const updateData: any = {
      name: data.name,
      phone: data.phone,
      email: data.email || duplicateLead.email,
      company: data.company || duplicateLead.company,
      website: data.website || duplicateLead.website,
      message: updatedNotes,
      source: data.source || 'web_form',
      status: 're-apply',
      qa_completed: false,
      qa_completed_at: null,
    };

    // Add UTM params if present
    if (hasUtmParams) {
      updateData.utm_source = utmParams.utm_source || duplicateLead.utm_source;
      updateData.utm_medium = utmParams.utm_medium || duplicateLead.utm_medium;
      updateData.utm_campaign = utmParams.utm_campaign || duplicateLead.utm_campaign;
      updateData.utm_content = utmParams.utm_content || duplicateLead.utm_content;
      updateData.utm_term = utmParams.utm_term || duplicateLead.utm_term;
      updateData.utm_timestamp = utmParams.utm_timestamp || duplicateLead.utm_timestamp;
    }

    lead = await pocketbase.collection('leads').update(duplicateLead.id, updateData) as Lead;

    console.log('[createOrUpdateLead] Duplicate lead updated:', lead.id);
    return { lead, action: 'updated' };
  } else {
    // Create new lead
    const createData: any = {
      ...data,
      createdBy: userId, // Will be undefined if no auth, that's ok
      status: data.status || 'new',
      score: data.score ?? 0,
      quality: data.quality || 'pending',
      tags: data.tags || [],
      qa_sent: false,
      qa_completed: false,
      ...utmParams,
    };

    // Debug log to see what we're creating
    console.log('[createOrUpdateLead] Creating lead with data:', JSON.stringify(createData, null, 2));

    lead = await pocketbase.collection('leads').create(createData) as Lead;

    console.log('[createOrUpdateLead] New lead created:', lead.id);
    return { lead, action: 'created' };
  }
}

/**
 * POST /api/leads - Create a new lead or update existing duplicate
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const body = await request.json() as CreateLeadDto;

    // Use the shared createOrUpdateLead helper
    const { lead, action } = await createOrUpdateLead(body, pb);

    // Trigger background poll job (fire and forget, don't await)
    setTimeout(async () => {
      try {
        const bgPb = await getServerPb();

        const bgLead = await bgPb.collection('leads').getOne<Lead>(lead.id);
        if (!bgLead || !bgLead.phone) {
          console.error('[Background Poll] Lead not found or no phone:', lead.id);
          return;
        }

        if (bgLead.qa_sent) {
          console.log('[Background Poll] Already sent for lead:', lead.id);
          return;
        }

        const questions = await fetchActiveQuestions();
        if (questions.length === 0) {
          console.error('[Background Poll] No active questions found');
          return;
        }

        const pollMessage = formatWhatsAppPollMessage(bgLead, questions);
        const chatId = bgLead.phone.replace(/\D/g, '') + '@c.us';

        const result = await sendWhatsAppMessage(chatId, pollMessage);
        if (!result) {
          console.error('[Background Poll] Failed to send WhatsApp message');
          return;
        }

        await logWhatsAppMessage({
          lead_id: lead.id,
          direction: 'outgoing',
          message_text: pollMessage,
          message_type: 'poll',
          status: 'sent',
          sent_at: new Date().toISOString(),
          green_api_id: result.idMessage
        });

        await bgPb.collection('leads').update(lead.id, {
          qa_sent: true,
          qa_sent_at: new Date().toISOString()
        });

        console.log('[Background Poll] Poll sent successfully for lead:', lead.id);
      } catch (error) {
        console.error('[Background Poll Job] Error:', error);
      }
    }, 60000);

    return NextResponse.json({
      success: true,
      action: action,
      message: action === 'updated' ? 'Lead updated (duplicate)' : 'Lead created',
      lead
    }, { status: action === 'updated' ? 200 : 201 });
  } catch (error) {
    console.error('[POST /api/leads] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
