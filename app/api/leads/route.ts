import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { createLead } from '@/lib/api/leads';
import type { Lead } from '@/types/lead';
import type { CreateLeadDto } from '@/types/lead';

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
 * POST /api/leads - Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const userId = pb.authStore.model?.id;
    const body = await request.json() as CreateLeadDto;

    // Create lead
    const lead = await pb.collection('leads').create<Lead>({
      ...body,
      createdBy: userId,
      status: body.status || 'new',
      score: body.score ?? 0,
      quality: body.quality || 'pending',
      tags: body.tags || [],
      qa_sent: false,
      qa_completed: false,
    });

    // Trigger background poll job (fire and forget, don't await)
    // Pass server pb instance for auth
    setTimeout(async () => {
      try {
        // Re-authenticate for background job
        const bgPb = await getServerPb();

        // Import required functions
        const { fetchActiveQuestions } = await import('@/lib/api/qa');
        const { formatPollMessage as formatWhatsAppPollMessage } = await import('@/lib/whatsapp/message-formatter');

        // Fetch lead
        const bgLead = await bgPb.collection('leads').getOne<Lead>(lead.id);
        if (!bgLead || !bgLead.phone) {
          console.error('[Background Poll] Lead not found or no phone:', lead.id);
          return;
        }

        // Skip if already sent
        if (bgLead.qa_sent) {
          console.log('[Background Poll] Already sent for lead:', lead.id);
          return;
        }

        // Fetch active questions
        const questions = await fetchActiveQuestions();
        if (questions.length === 0) {
          console.error('[Background Poll] No active questions found');
          return;
        }

        // Format and send poll
        const pollMessage = formatWhatsAppPollMessage(bgLead, questions);
        const chatId = bgLead.phone.replace(/\D/g, '') + '@c.us';

        // Import send functions
        const { sendWhatsAppMessage, logWhatsAppMessage } = await import('@/lib/api/whatsapp');

        const result = await sendWhatsAppMessage(chatId, pollMessage);
        if (!result) {
          console.error('[Background Poll] Failed to send WhatsApp message');
          return;
        }

        // Log message
        await logWhatsAppMessage({
          lead_id: lead.id,
          direction: 'outgoing',
          message_text: pollMessage,
          message_type: 'poll',
          status: 'sent',
          sent_at: new Date().toISOString(),
          green_api_id: result.idMessage
        });

        // Update lead: qa_sent = true
        await bgPb.collection('leads').update(lead.id, {
          qa_sent: true,
          qa_sent_at: new Date().toISOString()
        });

        console.log('[Background Poll] Poll sent successfully for lead:', lead.id);
      } catch (error) {
        console.error('[Background Poll Job] Error:', error);
      }
    }, 60000); // 1 minute delay

    return NextResponse.json({
      success: true,
      message: 'Lead created',
      lead
    }, { status: 201 });
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
