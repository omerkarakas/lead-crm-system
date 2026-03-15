import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { findLeadByPhone } from '@/lib/api/leads';
import { updateLead } from '@/lib/api/leads';
import { parsePollAnswer, validateAnswers } from '@/lib/whatsapp/poll-parser';
import { saveAnswer, fetchActiveQuestions, calculateLeadTotalScore } from '@/lib/api/qa';
import {
  formatBookingLinkMessage,
  formatLowQualityMessage,
  formatRetryMessage
} from '@/lib/whatsapp/message-formatter';
import { QA_CONFIG, getBookingLink } from '@/lib/config/qa';
import { LeadQuality } from '@/types/lead';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

/**
 * Green API Webhook endpoint for incoming WhatsApp messages
 * POST /api/whatsapp/webhook
 *
 * Handles two webhook types:
 * 1. incomingMessageReceived - User sends poll answer
 * 2. outgoingMessageStatus - Status update for sent messages (ignored)
 */
export async function POST(req: NextRequest) {
  // Create server-side PocketBase instance (no auth needed for webhook)
  const pb = new PocketBase(PB_URL);

  try {
    const body = await req.json();

    // Log webhook type for debugging
    console.log('[WhatsApp Webhook] typeWebhook:', body.typeWebhook);
    console.log('[WhatsApp Webhook] Payload keys:', Object.keys(body));

    // Handle status webhooks - just acknowledge and return
    if (body.typeWebhook === 'outgoingMessageStatus' || body.typeWebhook === 'outgoingAPIMessageStatus') {
      console.log('[WhatsApp Webhook] Status webhook received, acknowledging');
      // Optional: Update message status in database if we track it
      return NextResponse.json({ received: true });
    }

    // Only process incoming message webhooks
    if (body.typeWebhook !== 'incomingMessageReceived') {
      console.log('[WhatsApp Webhook] Unknown webhook type:', body.typeWebhook);
      return NextResponse.json({ received: true, message: 'Webhook type not handled' });
    }

    // Extract message data from incomingMessageReceived webhook
    // Green API structure: body.messageData.textMessageData.textMessage
    const messageData = body.messageData || {};
    const senderData = body.senderData || {};
    const chatId = senderData.chatId || '';
    const phone = chatId.replace('@c.us', '').replace(/\D/g, '');

    console.log('[WhatsApp Webhook] Processing incoming message from:', phone);

    // Extract message text with multiple fallback strategies
    let messageText = '';

    if (messageData.textMessageData?.textMessage) {
      const textMsg = messageData.textMessageData.textMessage;
      messageText = typeof textMsg === 'string' ? textMsg : String(textMsg || '');
    } else if (messageData.extendedTextMessageData?.text) {
      const extText = messageData.extendedTextMessageData.text;
      messageText = typeof extText === 'string' ? extText : String(extText || '');
    }

    // Ensure we have a string
    messageText = String(messageText || '');

    console.log('[WhatsApp Webhook] Extracted message:', {
      length: messageText.length,
      preview: messageText.substring(0, 50)
    });

    // Find lead by phone first
    const lead = await findLeadByPhone(phone);
    if (!lead) {
      console.log('[WhatsApp Webhook] Unknown sender, phone:', phone);
      return NextResponse.json({
        success: false,
        message: 'Unknown sender'
      });
    }

    // Log incoming message to database
    try {
      await pb.collection('whatsapp_messages').create({
        lead_id: lead.id,
        direction: 'incoming',
        message_text: messageText,
        message_type: 'poll',
        status: 'received',
        sent_at: new Date().toISOString()
      });
      console.log('[WhatsApp Webhook] Message logged successfully');
    } catch (logError: any) {
      console.error('[WhatsApp Webhook] Failed to log message:', logError.message);
      // Continue anyway - logging failure shouldn't block processing
    }

    // Parse answer
    const answer = parsePollAnswer(messageText);
    if (!answer) {
      console.log('[WhatsApp Webhook] Invalid answer format, sending retry message');
      const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
      const retryMessage = formatRetryMessage();

      await sendWhatsAppMessageDirect(chatIdClean, retryMessage);
      await logMessageDirect(pb, lead.id, 'outgoing', retryMessage, 'error', 'sent');

      return NextResponse.json({
        success: false,
        message: 'Invalid format'
      });
    }

    // Fetch active questions
    const questions = await fetchActiveQuestions();
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active questions'
      });
    }

    // Validate answers
    if (!validateAnswers(answer, questions.length)) {
      console.log('[WhatsApp Webhook] Invalid answer indices, sending retry message');
      const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
      const retryMessage = formatRetryMessage();

      await sendWhatsAppMessageDirect(chatIdClean, retryMessage);
      await logMessageDirect(pb, lead.id, 'outgoing', retryMessage, 'error', 'sent');

      return NextResponse.json({
        success: false,
        message: 'Invalid answer indices'
      });
    }

    // Save answers and calculate score
    let totalScore = 0;
    for (const [questionIndex, selectedOption] of Object.entries(answer)) {
      const qIndex = parseInt(questionIndex);

      if (qIndex < questions.length) {
        const question = questions[qIndex];
        const points = question.points[selectedOption] || 0;

        await saveAnswer({
          lead_id: lead.id,
          question_id: question.id,
          selected_answer: selectedOption,
          points_earned: points,
          answered_at: new Date().toISOString()
        });

        totalScore += points;
      }
    }

    // Calculate total score
    const finalScore = await calculateLeadTotalScore(lead.id);

    // Update lead score and quality
    const quality = finalScore >= QA_CONFIG.qualityScoreThreshold ? LeadQuality.QUALIFIED : LeadQuality.FOLLOWUP;
    await updateLead(lead.id, {
      total_score: finalScore,
      quality: quality,
      qa_completed: true,
      qa_completed_at: new Date().toISOString()
    });

    console.log('[WhatsApp Webhook] QA completed:', { leadId: lead.id, score: finalScore, quality });

    // Trigger auto-enrollment for low-score leads
    if (quality === LeadQuality.FOLLOWUP) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qa-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      }).catch((err) => {
        console.error('[WhatsApp Webhook] Failed to trigger auto-enrollment:', err);
      });
    }

    // Send response based on score
    const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
    let responseMessage = '';

    if (quality === LeadQuality.QUALIFIED) {
      const bookingLink = await getBookingLink();
      responseMessage = formatBookingLinkMessage(bookingLink);
    } else {
      responseMessage = formatLowQualityMessage();
    }

    const result = await sendWhatsAppMessageDirect(chatIdClean, responseMessage);
    await logMessageDirect(pb, lead.id, 'outgoing', responseMessage,
      quality === LeadQuality.QUALIFIED ? 'booking_link' : 'info', 'sent', result?.idMessage);

    return NextResponse.json({
      success: true,
      score: finalScore,
      quality
    });

  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Send WhatsApp message directly via Green API
 */
async function sendWhatsAppMessageDirect(
  chatId: string,
  message: string
): Promise<{ idMessage: string } | null> {
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('[sendWhatsAppMessageDirect] Green API credentials not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message })
      }
    );

    if (!response.ok) {
      throw new Error(`Green API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[sendWhatsAppMessageDirect] Error:', error);
    throw error;
  }
}

/**
 * Log WhatsApp message directly to database
 */
async function logMessageDirect(
  pb: PocketBase,
  leadId: string,
  direction: 'incoming' | 'outgoing',
  messageText: string,
  messageType: string,
  status: string,
  greenApiId?: string
): Promise<void> {
  try {
    const record = await pb.collection('whatsapp_messages').create({
      lead_id: leadId,
      direction: direction,
      message_text: String(messageText),
      message_type: messageType,
      status: status,
      sent_at: new Date().toISOString(),
      green_api_id: greenApiId
    });
    console.log('[logMessageDirect] Message logged:', record.id);
  } catch (error: any) {
    console.error('[logMessageDirect] Failed:', error.message);
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'whatsapp'
  });
}
