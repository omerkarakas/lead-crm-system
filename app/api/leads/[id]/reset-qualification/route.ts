import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { fetchActiveQuestions, deleteLeadQAAnswers } from '@/lib/api/qa';
import type { Lead } from '@/types/lead';

// Import poll message formatter
const { formatPollMessage } = require('@/lib/whatsapp/message-formatter');

/**
 * POST /api/leads/[id]/reset-qualification
 * Reset qualification and resend poll for a lead (admin only)
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

    // Check if lead has phone number
    if (!lead.phone) {
      return NextResponse.json(
        { error: 'Lead has no phone number' },
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

    // Delete QA answers
    await deleteLeadQAAnswers(leadId);

    // Reset lead fields
    await pb.collection('leads').update(leadId, {
      total_score: 0,
      quality: 'pending',
      qa_completed: false,
      qa_completed_at: null,
      qa_sent: false,
      qa_sent_at: null
    });

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

    console.log('[Reset Qualification] Qualification reset and poll sent successfully for lead:', leadId);

    return NextResponse.json({
      success: true,
      message: 'Qualification reset and poll sent successfully'
    });
  } catch (error: any) {
    console.error('[Reset Qualification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset qualification' },
      { status: 500 }
    );
  }
}
