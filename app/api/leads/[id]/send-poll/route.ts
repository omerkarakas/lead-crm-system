import { NextRequest, NextResponse } from 'next/server';
import { fetchLead, sendPollAfterDelay } from '@/lib/api/leads';
import pb from '@/lib/pocketbase';

/**
 * POST /api/leads/[id]/send-poll
 * Manually trigger poll sending for a lead
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;

    // Check authentication
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = pb.authStore.model as any;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Fetch lead
    const lead = await fetchLead(leadId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (lead.qa_completed) {
      return NextResponse.json(
        { error: 'QA already completed for this lead' },
        { status: 400 }
      );
    }

    // Trigger poll sending (immediately, no delay)
    await sendPollToLead(leadId);

    return NextResponse.json({
      success: true,
      message: 'Poll sent successfully'
    });
  } catch (error: any) {
    console.error('Send poll error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send poll' },
      { status: 500 }
    );
  }
}

/**
 * Send poll immediately to a lead (without delay)
 */
async function sendPollToLead(leadId: string): Promise<void> {
  const { fetchActiveQuestions } = await import('@/lib/api/qa');
  const { sendWhatsAppMessage, logWhatsAppMessage } = await import('@/lib/api/whatsapp');
  const { formatPollMessage } = await import('@/lib/whatsapp/message-formatter');
  const { updateLead } = await import('@/lib/api/leads');

  // Fetch lead
  const lead = await fetchLead(leadId);
  if (!lead || !lead.phone) {
    throw new Error('Lead not found or no phone');
  }

  // Fetch active questions
  const questions = await fetchActiveQuestions();
  if (questions.length === 0) {
    throw new Error('No active questions found');
  }

  // Format poll message
  const pollMessage = formatPollMessage(lead, questions);

  // Send WhatsApp
  const chatId = lead.phone.replace(/\D/g, '') + '@c.us';
  const result = await sendWhatsAppMessage(chatId, pollMessage);

  if (!result) {
    throw new Error('Failed to send WhatsApp message');
  }

  // Log message
  await logWhatsAppMessage({
    lead_id: leadId,
    direction: 'outgoing',
    message_text: pollMessage,
    message_type: 'poll',
    status: 'sent',
    sent_at: new Date().toISOString(),
    green_api_id: result.idMessage
  });

  // Update lead: qa_sent = true
  await updateLead(leadId, {
    qa_sent: true,
    qa_sent_at: new Date().toISOString()
  });

  console.log('QA poll sent manually to lead:', leadId);
}
