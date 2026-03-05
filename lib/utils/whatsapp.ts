import type { Lead } from '@/types/lead';

/**
 * Format WhatsApp notification for proposal acceptance
 */
export function formatProposalAcceptNotification(
  lead: Lead,
  proposalLink: string
): string {
  const company = lead.company ? ` (${lead.company})` : '';
  return `🎉 Harika haber! ${lead.name}${company} teklifi kabul etti.

📱 Müşteri: ${lead.name}
${lead.company ? `🏢 Şirket: ${lead.company}\n` : ''}📞 Telefon: ${lead.phone}

📄 Teklif Detayı: ${proposalLink}`;
}

/**
 * Format WhatsApp notification for proposal rejection
 */
export function formatProposalRejectNotification(
  lead: Lead,
  comment?: string
): string {
  const company = lead.company ? ` (${lead.company})` : '';
  let message = `❌ ${lead.name}${company} teklifi reddetti.

📱 Müşteri: ${lead.name}
${lead.company ? `🏢 Şirket: ${lead.company}\n` : ''}📞 Telefon: ${lead.phone}`;

  if (comment && comment.trim()) {
    message += `\n\n💬 Gerekçe: ${comment}`;
  } else {
    message += '\n\n💬 Gerekçe belirtilmedi.';
  }

  return message;
}

/**
 * Format phone number for WhatsApp (ensure +90 prefix)
 */
export function formatWhatsAppPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If starts with 90, add +
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    return cleaned;
  }

  // If 10 digits, add 90 prefix
  if (cleaned.length === 10) {
    return '90' + cleaned;
  }

  // If already has country code format, return as is
  return cleaned;
}

/**
 * Create chat ID from phone number for Green API
 */
export function createChatId(phone: string): string {
  const formatted = formatWhatsAppPhone(phone);
  return formatted + '@c.us';
}
