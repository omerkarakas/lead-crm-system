import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { findLeadByPhone } from '@/lib/api/leads';
import { updateLead } from '@/lib/api/leads';
import { parsePollAnswer, validateAnswers } from '@/lib/whatsapp/poll-parser';
import { saveAnswer, fetchActiveQuestions, fetchQuestion, calculateLeadTotalScore, calculatePointsEarned } from '@/lib/api/qa';
import {
  formatBookingLinkMessage,
  formatLowQualityMessage,
  formatRetryMessage
} from '@/lib/whatsapp/message-formatter';
import { QA_CONFIG, getBookingLink } from '@/lib/config/qa';
import { LeadQuality } from '@/types/lead';
import { phoneToChatId } from '@/lib/api/whatsapp';

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

    // Handle poll response webhooks (native WhatsApp polls)
    if (body.typeWebhook === 'incomingMessageReceived' && body.messageData?.pollMessageData) {
      console.log('[WhatsApp Webhook] Poll response received');
      console.log('[WhatsApp Webhook] Full pollMessageData:', JSON.stringify(body.messageData.pollMessageData, null, 2));
      return await handlePollResponse(body, pb);
    }

    // Only process incoming message webhooks (text-based answers)
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

        // Calculate points using the type-safe function
        const points = calculatePointsEarned(question, { selected_answer: selectedOption });

        await saveAnswer({
          lead_id: lead.id,
          question_id: question.id,
          selected_answer: selectedOption,
          points_earned: points,
          answered_at: new Date().toISOString(),
          question_type: question.question_type
        } as any); // Type assertion needed for legacy text-based answers

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

// =============================================================================
// POLL RESPONSE HANDLING
// =============================================================================

/**
 * Handle native WhatsApp poll response
 * Processes poll votes from SendPoll messages
 */
async function handlePollResponse(body: any, pb: PocketBase): Promise<NextResponse> {
  try {
    const pollData = body.messageData?.pollMessageData;
    const senderData = body.senderData || {};

    // Extract voted options from the new Green API format
    const votes = pollData?.votes || [];
    const multipleAnswers = pollData?.multipleAnswers || false;

    // Find which option was voted for
    const selectedIndices: number[] = [];
    votes.forEach((vote: any, index: number) => {
      if (vote.optionVoters && vote.optionVoters.length > 0) {
        selectedIndices.push(index);
      }
    });

    const pollMessageId = pollData?.pollMessageId;
    const selectedOptions = selectedIndices.map(String);
    const chatId = senderData.chatId || '';
    const phone = chatId.replace('@c.us', '').replace(/\D/g, '');

    console.log('[handlePollResponse] Poll response:', {
      pollMessageId,
      selectedIndices,
      phone,
      multipleAnswers
    });

    // Find lead by phone first
    const lead = await findLeadByPhone(phone);
    if (!lead) {
      console.log('[handlePollResponse] Lead not found for phone:', phone);
      return NextResponse.json({ received: true, message: 'Lead not found' });
    }

    const leadId = lead.id;

    console.log('[handlePollResponse] Found lead:', leadId, 'current_question_order:', lead.current_question_order);

    // Get active questions and find the current one using current_question_order
    const activeQuestions = await fetchActiveQuestions();
    console.log('[handlePollResponse] Active questions:', activeQuestions.map(q => ({ id: q.id, order: q.order, type: q.question_type, text: q.question_text })));
    const currentQuestionOrder = (lead as any).current_question_order || 1;
    const matchedQuestion = activeQuestions.find(q => q.order === currentQuestionOrder);

    if (!matchedQuestion) {
      console.log('[handlePollResponse] Question not found for order:', currentQuestionOrder);
      return NextResponse.json({ received: true, message: 'Question not found' });
    }

    console.log('[handlePollResponse] Matched question:', matchedQuestion.id, matchedQuestion.question_type);

    // Convert selected indices to answer format based on question type
    const answer = convertPollSelectionToAnswer(selectedIndices, matchedQuestion);

    // Calculate points earned
    const pointsEarned = calculatePointsFromSelection(matchedQuestion, selectedIndices);

    console.log('[handlePollResponse] About to save answer:', {
      leadId,
      questionId: matchedQuestion.id,
      questionType: matchedQuestion.question_type,
      selectedIndices,
      answer,
      answerType: typeof answer,
      pointsEarned
    });

    // Save the answer
    await saveAnswer({
      lead_id: leadId,
      question_id: matchedQuestion.id,
      selected_answer: answer,
      points_earned: pointsEarned,
      answered_at: new Date().toISOString(),
      question_type: matchedQuestion.question_type
    } as any);

    console.log('[handlePollResponse] Answer saved:', {
      leadId,
      questionId: matchedQuestion.id,
      answer,
      pointsEarned
    });

    // Log the incoming poll response
    await pb.collection('whatsapp_messages').create({
      lead_id: leadId,
      direction: 'incoming',
      message_text: JSON.stringify({ pollMessageId, selectedIndices, votes }),
      message_type: 'poll',
      status: 'received',
      sent_at: new Date().toISOString()
    });

    // Get answered question order to find next question
    const answeredQuestionOrder = matchedQuestion.order;

    // Find next question (first question with order greater than current)
    const nextQuestion = activeQuestions.find(q => q.order > answeredQuestionOrder);

    if (nextQuestion) {
      // Send next question
      console.log('[handlePollResponse] Sending next question:', nextQuestion.order, nextQuestion.question_text);

      const leadPhone = lead.phone;

      if (!leadPhone) {
        console.error('[handlePollResponse] Lead phone not found');
        return NextResponse.json({ success: false, error: 'Lead phone not found' }, { status: 500 });
      }

      try {
        // Import send functions
        const { sendQAQuestion } = await import('@/lib/api/whatsapp');

        const result = await sendQAQuestion(leadPhone, nextQuestion);

        if (result && result.idMessage) {
          // Log the sent question
          await pb.collection('whatsapp_messages').create({
            lead_id: leadId,
            direction: 'outgoing',
            message_text: nextQuestion.question_text,
            message_type: 'poll',
            status: 'sent',
            sent_at: new Date().toISOString(),
            green_api_id: result.idMessage
          });

          // Update current_question_order
          await pb.collection('leads').update(leadId, {
            current_question_order: nextQuestion.order
          });

          console.log('[handlePollResponse] Next question sent:', result.idMessage);
        } else {
          console.error('[handlePollResponse] sendQAQuestion returned null');
        }
      } catch (sendError: any) {
        console.error('[handlePollResponse] Failed to send next question:', sendError);
        return NextResponse.json({ success: false, error: sendError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        nextQuestion: nextQuestion.order,
        message: 'Answer saved, next question sent'
      });
    }

    // No more questions - complete QA
    console.log('[handlePollResponse] All questions answered, completing qualification');
    return await completeQualification(leadId, phone, pb);

  } catch (error: any) {
    console.error('[handlePollResponse] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Convert poll selection indices to answer format based on question type
 */
function convertPollSelectionToAnswer(selectedIndices: number[], question: any): string | string[] {
  const indices = selectedIndices.map(Number);

  switch (question.question_type) {
    case 'single': {
      // Index 0 → 'a', Index 1 → 'b', etc.
      const key = String.fromCharCode(97 + indices[0]);
      return key;
    }

    case 'multiple': {
      // Index 0 → 'option1', Index 1 → 'option2', etc.
      return indices.map(i => `option${i + 1}`);
    }

    case 'likert': {
      // Index → scale value (Index 0 → value 1, Index 1 → value 2, etc.)
      const scaleValues = question.scale_values || [];
      const scaleIndex = indices[0];
      if (scaleValues && scaleValues[scaleIndex]) {
        // Ensure value is a number, then convert to string for PocketBase
        const val = scaleValues[scaleIndex].value;
        const answerVal = typeof val === 'number' ? val : Number(val) || scaleIndex + 1;
        console.log('[convertPollSelectionToAnswer] Likert answer:', { scaleIndex, val, answerVal });
        return String(answerVal);
      }
      // Fallback: index + 1, converted to string
      return String(scaleIndex + 1);
    }

    default:
      return String(indices[0]);
  }
}

/**
 * Calculate points from poll selection
 */
function calculatePointsFromSelection(question: any, selectedIndices: number[]): number {
  const indices = selectedIndices.map(Number);

  switch (question.question_type) {
    case 'single': {
      const key = String.fromCharCode(97 + indices[0]);
      return question.points?.[key] || 0;
    }

    case 'multiple': {
      return indices.reduce((total: number, i: number) => {
        const optionKey = `option${i + 1}`;
        return total + (question.points?.[optionKey] || 0);
      }, 0);
    }

    case 'likert': {
      const scaleValues = question.scale_values || [];
      const scaleIndex = indices[0];
      if (scaleValues[scaleIndex]) {
        return scaleValues[scaleIndex].points || 0;
      }
      return 0;
    }

    default:
      return 0;
  }
}

/**
 * Complete qualification process - calculate score and update lead
 */
async function completeQualification(leadId: string, phone: string, pb: PocketBase): Promise<NextResponse> {
  // Calculate total score
  const finalScore = await calculateLeadTotalScore(leadId);

  // Update lead score and quality, reset current_question_order
  const quality = finalScore >= QA_CONFIG.qualityScoreThreshold ? LeadQuality.QUALIFIED : LeadQuality.FOLLOWUP;
  await pb.collection('leads').update(leadId, {
    total_score: finalScore,
    quality: quality,
    qa_completed: true,
    qa_completed_at: new Date().toISOString(),
    current_question_order: 0  // Reset for next time
  });

  console.log('[completeQualification] QA completed:', { leadId, score: finalScore, quality });

  // Trigger auto-enrollment for low-score leads
  if (quality === LeadQuality.FOLLOWUP) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qa-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId }),
    }).catch((err) => {
      console.error('[completeQualification] Failed to trigger auto-enrollment:', err);
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
  await logMessageDirect(pb, leadId, 'outgoing', responseMessage,
    quality === LeadQuality.QUALIFIED ? 'booking_link' : 'info', 'sent', result?.idMessage);

  return NextResponse.json({
    success: true,
    score: finalScore,
    quality,
    completed: true
  });
}
