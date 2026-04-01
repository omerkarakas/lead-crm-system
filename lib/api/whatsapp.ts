import PocketBase from 'pocketbase';
import type { WhatsAppMessage, QAQuestion } from '@/types/qa';

// Read from env (works in Next.js both server and client side)
const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create dedicated PocketBase instance for WhatsApp to prevent auto-cancellation
const pb = new PocketBase(PB_URL);

// Load auth from cookie if available (client-side only)
if (typeof window !== 'undefined') {
  const cookies = document.cookie.split(';');
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
  if (pbCookie) {
    try {
      pb.authStore.loadFromCookie(pbCookie.trim());
    } catch (e) {
      console.warn('Failed to load auth from cookie:', e);
    }
  }
}

/**
 * Send WhatsApp message via Green API
 */
export async function sendWhatsAppMessage(
  chatId: string,
  message: string
): Promise<{ idMessage: string } | null> {
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('Green API credentials not configured');
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    throw error;
  }
}

/**
 * Log WhatsApp message to whatsapp_messages collection
 */
export async function logWhatsAppMessage(data: WhatsAppMessage): Promise<string | null> {
  try {
    // Log input data for debugging
    console.log('[logWhatsAppMessage] Input data type:', {
      messageText_type: typeof data.message_text,
      messageText_value: data.message_text,
      fullData: {
        lead_id: data.lead_id,
        direction: data.direction,
        message_type: data.message_type,
        status: data.status
      }
    });

    // Ensure message_text is always a string
    let messageText = data.message_text;
    if (typeof messageText !== 'string') {
      console.warn('[logWhatsAppMessage] message_text is not a string:', typeof messageText, messageText);
      messageText = typeof messageText === 'object' ? JSON.stringify(messageText) : String(messageText || '');
    }

    console.log('[logWhatsAppMessage] Creating record with messageText type:', typeof messageText);

    const record = await pb.collection('whatsapp_messages').create<WhatsAppMessage>({
      lead_id: data.lead_id,
      direction: data.direction,
      message_text: messageText,
      message_type: data.message_type,
      status: data.status,
      sent_at: data.sent_at || new Date().toISOString(),
      green_api_id: data.green_api_id
    });

    console.log('[logWhatsAppMessage] Record created successfully:', record.id);
    return record.id || null;
  } catch (error: any) {
    console.error('[logWhatsAppMessage] Error details:', {
      message: error.message,
      data: error.data,
      status: error.status,
      isAbortError: error.name === 'ClientAbortError',
      errorMessage: error.toString()
    });
    return null;
  }
}

/**
 * Get messages for a lead (chronological order - oldest first)
 */
export async function getLeadWhatsAppMessages(leadId: string): Promise<WhatsAppMessage[]> {
  try {
    const response = await pb.collection('whatsapp_messages').getList<WhatsAppMessage>(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: 'sent_at'
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors - they occur when a request is superseded
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Get lead WhatsApp messages error:', error);
    return [];
  }
}

/**
 * Get unread message count for a lead
 */
export async function getUnreadMessageCount(leadId: string): Promise<number> {
  try {
    const response = await pb.collection('whatsapp_messages').getList(1, 1, {
      filter: `lead_id = "${leadId}" && direction = "incoming"`,
      skipTotal: true
    });

    return response.totalItems;
  } catch (error) {
    console.error('Get unread message count error:', error);
    return 0;
  }
}

// =============================================================================
// SENDPOLL API FUNCTIONS
// =============================================================================

/**
 * SendPoll response format from Green API
 */
export interface SendPollResponse {
  idMessage: string;
}

/**
 * Send a native WhatsApp poll via Green API SendPoll method
 */
export async function sendPoll(
  chatId: string,
  message: string,
  options: string[],
  allowMultipleAnswers: boolean
): Promise<SendPollResponse | null> {
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('[sendPoll] Green API credentials not configured');
    return null;
  }

  // Green API SendPoll requires options as objects with optionName property
  const optionsObjects = options.map(opt => ({ optionName: opt }));

  try {
    const response = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendPoll/${GREEN_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message,
          options: optionsObjects,
          multipleAnswers: allowMultipleAnswers
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Green API SendPoll error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[sendPoll] Poll sent successfully:', data.idMessage);
    return data;
  } catch (error) {
    console.error('[sendPoll] Error:', error);
    throw error;
  }
}

/**
 * Send an open-ended question as a regular text message
 */
export async function sendOpenQuestion(
  chatId: string,
  questionText: string,
  minLength?: number,
  maxLength?: number
): Promise<{ idMessage: string } | null> {
  let message = questionText;

  // Add length constraints if specified
  if (minLength !== undefined || maxLength !== undefined) {
    const constraints = [];
    if (minLength) constraints.push(`min ${minLength}`);
    if (maxLength) constraints.push(`max ${maxLength}`);
    message += `\n\n(${constraints.join(', ')} karakter)`;
  }
  message += '\n\nCevabınızı buraya yazın...';

  return sendWhatsAppMessage(chatId, message);
}

// =============================================================================
// QUESTION MAPPING HELPERS
// =============================================================================

/**
 * Map question to poll options (SendPoll format)
 * - Single: ["a) Opt1", "b) Opt2"] → ["Opt1", "Opt2"]
 * - Multiple: ["Opt1", "Opt2"] → ["Opt1", "Opt2"]
 * - Likert: scale_values → ["Çok kötü", "Kötü", "Nötr", "İyi", "Çok iyi"]
 */
export function mapQuestionToPollOptions(question: QAQuestion): string[] {
  switch (question.question_type) {
    case 'single':
      // Remove "a) ", "b) " prefixes for SendPoll
      return question.options.map(opt => opt.replace(/^[a-z]\)\s*/, ''));

    case 'multiple':
      // Multiple choice options are plain text, use as-is
      return question.options;

    case 'likert':
      // Extract labels from scale_values
      const scaleValues = (question as any).scale_values || [];
      if (scaleValues.length > 0) {
        return scaleValues.map((v: any) => v.label || `${v.value}`);
      }
      // Fallback to default labels if no scale_values
      return ['Çok kötü', 'Kötü', 'Nötr', 'İyi', 'Çok iyi'];

    default:
      return [];
  }
}

/**
 * Get multipleAnswers flag for SendPoll based on question type
 */
export function getMultipleAnswersFlag(question: QAQuestion): boolean {
  return question.question_type === 'multiple';
}

/**
 * Calculate chatId from phone number
 */
export function phoneToChatId(phone: string): string {
  return phone.replace(/\D/g, '') + '@c.us';
}

// =============================================================================
// QA QUESTION DISPATCH
// =============================================================================

/**
 * Send a QA question using the appropriate method based on question type
 * - Single/Multiple/Likert → SendPoll
 * - Open → Regular message
 *
 * Returns the message ID for tracking
 */
export async function sendQAQuestion(
  phoneNumber: string,
  question: QAQuestion
): Promise<{ idMessage: string } | null> {
  const chatId = phoneToChatId(phoneNumber);

  switch (question.question_type) {
    case 'single':
    case 'multiple':
    case 'likert': {
      const options = mapQuestionToPollOptions(question);
      const allowMultiple = getMultipleAnswersFlag(question);
      return sendPoll(chatId, question.question_text, options, allowMultiple);
    }

    case 'open': {
      const openQ = question as any;
      return sendOpenQuestion(
        chatId,
        question.question_text,
        openQ.min_length,
        openQ.max_length
      );
    }

    default:
      // TypeScript exhaustiveness check - this should never happen with valid types
      const _exhaustiveCheck: never = question;
      console.warn('[sendQAQuestion] Unknown question type:', (_exhaustiveCheck as any).question_type);
      return null;
  }
}
