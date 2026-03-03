import pb from '@/lib/pocketbase';
import type { WhatsAppMessage } from '@/types/qa';

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

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
    const record = await pb.collection('whatsapp_messages').create<WhatsAppMessage>({
      lead_id: data.lead_id,
      direction: data.direction,
      message_text: data.message_text,
      message_type: data.message_type,
      status: data.status,
      sent_at: data.sent_at || new Date().toISOString(),
      green_api_id: data.green_api_id
    });

    return record.id || null;
  } catch (error) {
    console.error('Log WhatsApp message error:', error);
    return null;
  }
}

/**
 * Get messages for a lead
 */
export async function getLeadWhatsAppMessages(leadId: string): Promise<WhatsAppMessage[]> {
  try {
    const response = await pb.collection('whatsapp_messages').getList<WhatsAppMessage>(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-sent_at'
    });

    return response.items;
  } catch (error) {
    console.error('Get lead WhatsApp messages error:', error);
    return [];
  }
}
