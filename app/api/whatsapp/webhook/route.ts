import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { findLeadByPhone } from '@/lib/api/leads';
import { updateLead } from '@/lib/api/leads';
import { parsePollAnswer, validateAnswers } from '@/lib/whatsapp/poll-parser';
import { saveAnswer, fetchActiveQuestions, calculateLeadTotalScore } from '@/lib/api/qa';
import { logWhatsAppMessage, sendWhatsAppMessage } from '@/lib/api/whatsapp';
import {
  formatBookingLinkMessage,
  formatLowQualityMessage,
  formatRetryMessage
} from '@/lib/whatsapp/message-formatter';
import { QA_CONFIG } from '@/lib/config/qa';

/**
 * Green API Webhook endpoint for incoming WhatsApp messages
 * POST /api/whatsapp/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract phone and message from Green API webhook
    const senderData = body.body?.senderData || body.senderData || {};
    const messageData = body.body?.messageData || body.messageData || {};

    let chatId = senderData.chatId || senderData.sender || '';
    let phone = chatId.replace('@c.us', '').replace(/\D/g, '');

    let messageText = '';
    if (messageData.textMessageData) {
      messageText = messageData.textMessageData.textMessage || '';
    } else if (messageData.extendedTextMessageData) {
      messageText = messageData.extendedTextMessageData.text || '';
    }

    // Log incoming message (lead_id will be filled after finding lead)
    const incomingMessageId = await logWhatsAppMessage({
      lead_id: '',
      direction: 'incoming',
      message_text: messageText,
      message_type: 'poll',
      status: 'received',
      sent_at: new Date().toISOString()
    });

    // Find lead by phone
    const lead = await findLeadByPhone(phone);
    if (!lead) {
      console.log('Unknown sender, phone:', phone);
      return NextResponse.json({
        success: false,
        message: 'Unknown sender'
      });
    }

    // Update the incoming message with the lead_id
    if (incomingMessageId) {
      try {
        await pb.collection('whatsapp_messages').update(incomingMessageId, {
          lead_id: lead.id
        });
      } catch (e) {
        console.error('Failed to update message lead_id:', e);
      }
    }

    // Parse answer
    const answer = parsePollAnswer(messageText);
    if (!answer) {
      // Invalid format - send retry message
      const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
      const retryMessage = formatRetryMessage();
      await sendWhatsAppMessage(chatIdClean, retryMessage);
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: retryMessage,
        message_type: 'error',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
      return NextResponse.json({
        success: false,
        message: 'Invalid format'
      });
    }

    // Fetch active questions to validate answers
    const questions = await fetchActiveQuestions();
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active questions'
      });
    }

    // Validate answers
    if (!validateAnswers(answer, questions.length)) {
      const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
      const retryMessage = formatRetryMessage();
      await sendWhatsAppMessage(chatIdClean, retryMessage);
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: retryMessage,
        message_type: 'error',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
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

    // Calculate total score (including any previous answers)
    const finalScore = await calculateLeadTotalScore(lead.id);

    // Update lead score and quality
    const quality = finalScore >= QA_CONFIG.qualityScoreThreshold ? 'qualified' : 'pending';
    await updateLead(lead.id, {
      total_score: finalScore,
      quality: quality,
      qa_completed: true,
      qa_completed_at: new Date().toISOString()
    });

    // Send response based on score
    const chatIdClean = phone.replace(/\D/g, '') + '@c.us';
    let responseMessage = '';

    if (quality === 'qualified') {
      responseMessage = formatBookingLinkMessage(QA_CONFIG.calcomMeetingUrl);
    } else {
      responseMessage = formatLowQualityMessage();
    }

    const result = await sendWhatsAppMessage(chatIdClean, responseMessage);
    await logWhatsAppMessage({
      lead_id: lead.id,
      direction: 'outgoing',
      message_text: responseMessage,
      message_type: quality === 'qualified' ? 'booking_link' : 'info',
      status: 'sent',
      sent_at: new Date().toISOString(),
      green_api_id: result?.idMessage
    });

    return NextResponse.json({
      success: true,
      score: finalScore,
      quality
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification (if needed by Green API)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'whatsapp'
  });
}
