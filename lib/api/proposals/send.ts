import pb from '@/lib/pocketbase';
import type { Lead } from '@/types/lead';
import type { Appointment } from '@/types/appointment';
import type {
  ProposalTemplate,
  CreateProposalDto,
  ProposalResponse,
} from '@/types/proposal';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';
import {
  generateProposalToken,
  generateProposalLink,
  calculateExpirationDate,
  getLeadVariables,
} from '@/lib/utils/proposal';

/**
 * Send proposal via WhatsApp
 */
export async function sendProposalViaWhatsApp(
  leadId: string,
  templateId: string,
  variables?: Record<string, string>,
  expiresInDays: number = 3
): Promise<{
  success: boolean;
  proposal_id?: string;
  token?: string;
  link?: string;
  error?: string;
}> {
  try {
    // Fetch lead and template
    const lead = await pb.collection('leads').getOne<Lead>(leadId);
    const template = await pb.collection('proposal_templates').getOne<ProposalTemplate>(templateId, {
      filter: 'is_deleted = false',
    });

    // Check if template is active
    if (!template.is_active) {
      return {
        success: false,
        error: 'Template is not active',
      };
    }

    // Get variables from lead
    const leadVars = getLeadVariables(lead);

    // Merge with custom variables
    const allVariables = { ...leadVars, ...variables };

    // Generate filled content
    let filledContent = template.content;
    Object.keys(allVariables).forEach(key => {
      const placeholder = `{${key}}`;
      filledContent = filledContent.replace(new RegExp(placeholder, 'g'), allVariables[key] || '');
    });

    // Generate token and expiration
    const token = generateProposalToken();
    const expiresAt = calculateExpirationDate(expiresInDays);
    const link = generateProposalLink(token);

    // Create proposal record
    const proposal = await pb.collection('proposals').create({
      lead_id: leadId,
      template_id: templateId,
      content: template.content,
      filled_content: filledContent,
      variables_used: allVariables,
      token: token,
      expires_at: expiresAt.toISOString(),
      response: 'cevap_bekleniyor',
    });

    // Format phone number for Green API (needs @c.us suffix)
    const chatId = lead.phone.replace(/\D/g, '') + '@c.us';

    // Send WhatsApp message
    // Make the URL clickable by surrounding with spaces
    const message = `Merhaba ${lead.name}, size özel hazırladığımız teklifi inceleyebilirsiniz:\n\n${link}\n\nLink ${expiresInDays} gün geçerlidir.`;

    const whatsappResult = await sendWhatsAppMessage(chatId, message);

    // Log WhatsApp message
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
    }

    // Update lead record with proposal tracking
    await pb.collection('leads').update(leadId, {
      offer_document_url: link,
      offer_date: new Date().toISOString().split('T')[0],
      offer_response: 'cevap_bekleniyor',
    });

    return {
      success: true,
      proposal_id: proposal.id,
      token: token,
      link: link,
    };
  } catch (error: any) {
    console.error('Send proposal via WhatsApp error:', error);

    // Log error but don't throw (fire-and-forget pattern)
    return {
      success: false,
      error: error.message || 'Failed to send proposal',
    };
  }
}

/**
 * Get lead variables for proposal template
 */
export async function getLeadVariablesForProposal(
  leadId: string,
  appointmentId?: string
): Promise<Record<string, string>> {
  const lead = await pb.collection('leads').getOne<Lead>(leadId);

  let appointment: Appointment | undefined;
  if (appointmentId) {
    try {
      appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId);
    } catch (error) {
      console.warn('Appointment not found:', appointmentId);
    }
  }

  return getLeadVariables(lead, appointment);
}

/**
 * Generate proposal link from token
 */
export function generateProposalTokenLink(token: string): string {
  return generateProposalLink(token);
}

/**
 * Validate proposal token
 */
export async function validateProposalToken(token: string): Promise<{
  valid: boolean;
  proposal?: any;
  error?: string;
}> {
  try {
    const proposal = await pb.collection('proposals').getFirstListItem(`token = "${token}"`, {
      expand: 'lead_id,template_id',
    });

    // Check expiration
    const expiresAt = new Date(proposal.expires_at);
    if (expiresAt < new Date()) {
      return {
        valid: false,
        error: 'Proposal link has expired',
      };
    }

    return {
      valid: true,
      proposal: proposal,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: 'Invalid proposal token',
    };
  }
}
