import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { fetchActiveQuestions } from '@/lib/api/qa';
import { fetchLead } from '@/lib/api/leads';
import type { Lead } from '@/types/lead';

// Import poll message formatter
const { formatPollMessage } = require('@/lib/whatsapp/message-formatter');

/**
 * POST /api/leads/[id]/send-poll
 * Manually trigger poll sending for a lead (server-side)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getServerPb();
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
    const lead = await pb.collection('leads').getOne<Lead>(leadId);
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

    // Check if already sent
    if (lead.qa_sent) {
      return NextResponse.json(
        { error: 'Poll already sent for this lead' },
        { status: 400 }
      );
    }

    // Fetch active questions
    const questions = await fetchActiveQuestions();
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No active questions found' },
        { status: 400 }
      );
    }

    // Format poll message
    const pollMessage = formatPollMessage(lead, questions);

    // Send WhatsApp (direct fetch to Green API)
    const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
    const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

    if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
      return NextResponse.json(
        { error: 'Green API credentials not configured' },
        { status: 500 }
      );
    }

    const chatId = (lead.phone || '').replace(/\D/g, '') + '@c.us';
    const response = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: pollMessage })
      }
    );

    if (!response.ok) {
      throw new Error(`Green API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Log message to WhatsApp collection
    await pb.collection('whatsapp_messages').create({
      lead_id: leadId,
      direction: 'outgoing',
      message_text: pollMessage,
      message_type: 'poll',
      status: 'sent',
      sent_at: new Date().toISOString(),
      green_api_id: result.idMessage
    });

    // Update lead: qa_sent = true
    await pb.collection('leads').update(leadId, {
      qa_sent: true,
      qa_sent_at: new Date().toISOString()
    });

    console.log('[Send Poll] Poll sent successfully for lead:', leadId);

    return NextResponse.json({
      success: true,
      message: 'Poll sent successfully'
    });
  } catch (error: any) {
    console.error('[Send Poll] Error:', error);
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
  const chatId = (lead.phone || '').replace(/\D/g, '') + '@c.us';
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
