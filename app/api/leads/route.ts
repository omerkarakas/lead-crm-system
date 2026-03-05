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
 * POST /api/leads - Create a new lead or update existing duplicate
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const userId = pb.authStore.model?.id;
    const body = await request.json() as CreateLeadDto;

    // Extract UTM parameters
    const utmParams = {
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      utm_content: body.utm_content,
      utm_term: body.utm_term,
      utm_timestamp: body.utm_timestamp,
    };

    // Check if any UTM params are present, add timestamp if not provided
    const hasUtmParams = Object.values(utmParams).some(v => v !== undefined && v !== '');
    if (hasUtmParams && !utmParams.utm_timestamp) {
      utmParams.utm_timestamp = new Date().toISOString();
    }

    // Check for duplicate lead (by phone OR email)
    let duplicateLead: Lead | null = null;
    const filterParts: string[] = [];

    if (body.phone) {
      filterParts.push(`phone = "${body.phone}"`);
    }
    if (body.email) {
      filterParts.push(`email = "${body.email}"`);
    }

    if (filterParts.length > 0) {
      try {
        const duplicates = await pb.collection<Lead>('leads').getList(1, 1, {
          filter: filterParts.join(' || '),
        });
        if (duplicates.items.length > 0) {
          duplicateLead = duplicates.items[0];
        }
      } catch (error) {
        console.error('[POST /api/leads] Error checking duplicates:', error);
      }
    }

    let lead: Lead;

    if (duplicateLead) {
      // Handle duplicate - update existing lead
      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Store old values in notes field
      const oldValuesNote = `TEKRAR BASVURU [${dateStr}]: Eski değerler - name: ${duplicateLead.name}, phone: ${duplicateLead.phone}, email: ${duplicateLead.email || ''}, company: ${duplicateLead.company || ''}`;
      const existingNotes = duplicateLead.message || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n\n${oldValuesNote}` : oldValuesNote;

      // Prepare update data
      const updateData: any = {
        name: body.name,
        phone: body.phone,
        email: body.email || duplicateLead.email,
        company: body.company || duplicateLead.company,
        website: body.website || duplicateLead.website,
        message: updatedNotes,
        source: 'web_form',
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

      lead = await pb.collection('leads').update<Lead>(duplicateLead.id, updateData);

      console.log('[POST /api/leads] Duplicate lead updated:', lead.id);
    } else {
      // Create new lead
      lead = await pb.collection('leads').create<Lead>({
        ...body,
        createdBy: userId,
        status: body.status || 'new',
        score: body.score ?? 0,
        quality: body.quality || 'pending',
        tags: body.tags || [],
        qa_sent: false,
        qa_completed: false,
        ...utmParams,
      });

      console.log('[POST /api/leads] New lead created:', lead.id);
    }

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
      action: duplicateLead ? 'updated' : 'created',
      message: duplicateLead ? 'Lead updated (duplicate)' : 'Lead created',
      lead
    }, { status: duplicateLead ? 200 : 201 });
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
