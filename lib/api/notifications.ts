import type PocketBase from 'pocketbase';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';
import {
  formatProposalAcceptNotification,
  formatProposalRejectNotification,
} from '@/lib/utils/whatsapp';
import type { ProposalResponse } from '@/types/proposal';
import type { Lead } from '@/types/lead';
import type { Proposal } from '@/types/proposal';

interface NotificationResult {
  success: boolean;
  notified_count: number;
  errors: string[];
}

/**
 * Get sales team phone numbers from app_settings
 * This is the ONLY source for sales team phones (single source of truth)
 */
async function getSalesTeamPhones(pb: PocketBase): Promise<string[]> {
  try {
    const records = await pb.collection('app_settings').getList(1, 10, {
      filter: 'service_name = "proposal_notifications" && setting_key = "sales_phones"',
    });

    if (records.items.length > 0 && records.items[0].is_active) {
      const phonesValue = records.items[0].setting_value;
      // Parse comma-separated phone numbers
      return phonesValue
        .split(',')
        .map((p: string) => p.trim().replace(/\D/g, ''))
        .filter((p: string) => p.length >= 10);
    }

    return [];
  } catch (error) {
    console.error('Get sales team phones error:', error);
    return [];
  }
}

/**
 * Check if proposal notifications are enabled
 */
async function areProposalNotificationsEnabled(pb: PocketBase): Promise<boolean> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1, {
      filter: 'service_name = "proposal_notifications" && setting_key = "enabled"',
    });

    if (records.items.length > 0) {
      return records.items[0].is_active && records.items[0].setting_value === 'true';
    }

    return true; // Default to enabled if not configured
  } catch (error) {
    console.error('Check proposal notifications enabled error:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Validate that sales team phones are configured in app_settings
 */
export async function validateSalesPhonesConfigured(pb: PocketBase): Promise<{ valid: boolean; error?: string }> {
  const phones = await getSalesTeamPhones(pb);
  if (phones.length === 0) {
    return {
      valid: false,
      error: 'Satış ekibi telefon numaraları yapılandırılmamış. Settings sayfasından "Satış Ekibi Telefonları" alanını doldurun.'
    };
  }
  return { valid: true };
}

/**
 * Send WhatsApp notification to sales team about proposal response
 */
async function notifySalesTeam(
  pb: PocketBase,
  message: string,
  leadId: string
): Promise<{ notified_count: number; errors: string[] }> {
  const errors: string[] = [];
  let notified_count = 0;

  // Get phones from app_settings only (single source of truth)
  const phones = await getSalesTeamPhones(pb);

  // If no phones found, return error
  if (phones.length === 0) {
    errors.push('Satış ekibi telefon numarası bulunamadı. Settings sayfasından "Satış Ekibi Telefonları" alanını yapılandırın.');
    return { notified_count: 0, errors };
  }

  // Send to each phone number
  for (const phone of phones) {
    try {
      const chatId = phone + '@c.us';
      const whatsappResult = await sendWhatsAppMessage(chatId, message);

      if (whatsappResult) {
        await logWhatsAppMessage({
          lead_id: leadId,
          direction: 'outgoing',
          message_text: message,
          message_type: 'info',
          status: 'sent',
          sent_at: new Date().toISOString(),
          green_api_id: whatsappResult.idMessage,
        });
        notified_count++;
      }
    } catch (error: any) {
      const errorMsg = `Failed to notify ${phone}: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return { notified_count, errors };
}

/**
 * Send notification when lead responds to proposal
 */
export async function sendProposalResponseNotification(
  pb: PocketBase,
  proposal: Proposal,
  lead: Lead
): Promise<NotificationResult> {
  const errors: string[] = [];

  try {
    // Check if notifications are enabled
    const enabled = await areProposalNotificationsEnabled(pb);
    if (!enabled) {
      console.log('Proposal notifications are disabled');
      return { success: true, notified_count: 0, errors: [] };
    }

    // Format message based on response
    let message: string;
    const proposalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/proposals/${proposal.token}`;

    if (proposal.response === 'kabul') {
      message = formatProposalAcceptNotification(lead, proposalLink);
    } else {
      message = formatProposalRejectNotification(lead, proposal.response_comment);
    }

    // Send to sales team
    const result = await notifySalesTeam(pb, message, proposal.lead_id);

    return {
      success: result.notified_count > 0,
      notified_count: result.notified_count,
      errors: result.errors,
    };
  } catch (error: any) {
    console.error('Send proposal response notification error:', error);
    errors.push(error.message || 'Unknown error');
    return { success: false, notified_count: 0, errors };
  }
}

/**
 * Send test notification for proposal notifications
 */
export async function sendTestProposalNotification(
  pb: PocketBase,
  message?: string
): Promise<NotificationResult> {
  const errors: string[] = [];

  try {
    // Check if notifications are enabled
    const enabled = await areProposalNotificationsEnabled(pb);
    if (!enabled) {
      return { success: false, notified_count: 0, errors: ['Notifications are disabled'] };
    }

    // Use custom message or default test message
    const notificationMessage = message || '🧪 Test Bildirimi\n\nBu bir test bildirimidir.';

    // Send to sales team
    const result = await notifySalesTeam(pb, notificationMessage, '');

    return {
      success: result.notified_count > 0,
      notified_count: result.notified_count,
      errors: result.errors,
    };
  } catch (error: any) {
    console.error('Send test proposal notification error:', error);
    errors.push(error.message || 'Unknown error');
    return { success: false, notified_count: 0, errors };
  }
}
