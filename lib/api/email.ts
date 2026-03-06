import PocketBase from 'pocketbase';
import { replaceVariables } from '@/lib/email/template-variables';
import type { Lead } from '@/types/lead';
import type {
  EmailMessage,
  EmailStatus,
  EmailDirection,
  SendEmailDto,
  SendEmailToLeadDto,
  ResendResponse
} from '@/types/email';
import { EmailStatus as EmailStatusEnum, EmailDirection as EmailDirectionEnum } from '@/types/email';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'Moka CRM';

// Create dedicated PocketBase instance for Email to prevent auto-cancellation
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
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
 * Send email via Resend API
 */
export async function sendEmail(data: SendEmailDto): Promise<ResendResponse | null> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }

  try {
    const fromAddress = RESEND_FROM_NAME
      ? `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`
      : RESEND_FROM_EMAIL;

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
}

/**
 * Log email message to PocketBase email_messages collection
 */
export async function logEmailMessage(data: {
  lead_id: string;
  to_email: string;
  subject: string;
  body: string;
  template_id?: string;
  direction: EmailDirection;
  status: EmailStatus;
  sent_at?: string;
  resend_message_id?: string;
}): Promise<string | null> {
  try {
    const record = await pb.collection('email_messages').create<EmailMessage>({
      lead_id: data.lead_id,
      to_email: data.to_email,
      subject: data.subject,
      body: data.body,
      template_id: data.template_id,
      direction: data.direction,
      status: data.status,
      sent_at: data.sent_at || new Date().toISOString(),
      resend_message_id: data.resend_message_id
    });

    return record.id || null;
  } catch (error) {
    console.error('Log email message error:', error);
    return null;
  }
}

/**
 * Update email message status in PocketBase
 */
export async function updateEmailMessageStatus(
  messageId: string,
  status: EmailStatus,
  resendMessageId?: string
): Promise<boolean> {
  try {
    const updateData: Partial<EmailMessage> = {
      status
    };

    if (resendMessageId) {
      updateData.resend_message_id = resendMessageId;
    }

    await pb.collection('email_messages').update(messageId, updateData);
    return true;
  } catch (error) {
    console.error('Update email message status error:', error);
    return false;
  }
}

/**
 * Get messages for a lead (chronological order - oldest first)
 */
export async function getLeadEmailMessages(leadId: string): Promise<EmailMessage[]> {
  try {
    const response = await pb.collection('email_messages').getList<EmailMessage>(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: 'created'
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Get lead email messages error:', error);
    return [];
  }
}

/**
 * Send email to a lead with variable substitution
 * This is the main function for sending emails to leads
 */
export async function sendEmailToLead(
  leadId: string,
  options: SendEmailToLeadDto = {}
): Promise<{ success: boolean; messageId?: string; error?: string; emailLogId?: string }> {
  try {
    // Fetch lead from PocketBase
    const lead = await pb.collection('leads').getOne<Lead>(leadId);

    if (!lead.email) {
      throw new Error('Lead has no email address');
    }

    let subject = options.subject || '';
    let body = options.body || '';
    const templateId = options.template_id;

    // If template_id is provided, fetch template (placeholder for future)
    if (templateId) {
      try {
        const template = await pb.collection('email_templates').getOne(templateId);
        subject = subject || template.subject;
        body = body || template.body;
      } catch (error) {
        console.warn('Template not found, using provided subject/body');
      }
    }

    // If no subject or body provided, return error
    if (!subject || !body) {
      throw new Error('Either template_id or subject+body must be provided');
    }

    // Replace variables with lead data
    const processedSubject = replaceVariables(subject, lead);
    const processedBody = replaceVariables(body, lead);

    // Create initial email log with pending status
    const emailLogId = await logEmailMessage({
      lead_id: leadId,
      to_email: lead.email,
      subject: processedSubject,
      body: processedBody,
      template_id: templateId,
      direction: EmailDirectionEnum.OUTGOING,
      status: EmailStatusEnum.PENDING
    });

    if (!emailLogId) {
      throw new Error('Failed to create email log');
    }

    // Send email via Resend
    const resendResponse = await sendEmail({
      to: lead.email,
      subject: processedSubject,
      html: processedBody
    });

    if (!resendResponse) {
      // Update log as failed
      await updateEmailMessageStatus(emailLogId, EmailStatusEnum.FAILED);
      return {
        success: false,
        error: 'Failed to send email via Resend (API key not configured)',
        emailLogId
      };
    }

    // Update log with sent status and Resend message ID
    await updateEmailMessageStatus(emailLogId, EmailStatusEnum.SENT, resendResponse.id);

    return {
      success: true,
      messageId: resendResponse.id,
      emailLogId
    };
  } catch (error) {
    console.error('Send email to lead error:', error);

    // Try to log the failure if we have an emailLogId
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get email message count for a lead
 */
export async function getEmailMessageCount(leadId: string): Promise<number> {
  try {
    const response = await pb.collection('email_messages').getList(1, 1, {
      filter: `lead_id = "${leadId}"`,
      skipTotal: true
    });

    return response.totalItems;
  } catch (error) {
    console.error('Get email message count error:', error);
    return 0;
  }
}

/**
 * Get last used template for a lead
 * Returns the template_id from the most recent outgoing email
 */
export async function getLastUsedTemplate(leadId: string): Promise<string | null> {
  try {
    const response = await pb.collection('email_messages').getList<EmailMessage>(1, 1, {
      filter: `lead_id = "${leadId}" && direction = "outgoing"`,
      sort: '-sent_at'
    });

    if (response.items.length > 0 && response.items[0].template_id) {
      return response.items[0].template_id;
    }

    return null;
  } catch (error) {
    console.error('Get last used template error:', error);
    return null;
  }
}

/**
 * Get email history for a lead (outgoing emails only, newest first)
 */
export async function getEmailHistory(leadId: string): Promise<EmailMessage[]> {
  try {
    const response = await pb.collection('email_messages').getList<EmailMessage>(1, 100, {
      filter: `lead_id = "${leadId}" && direction = "outgoing"`,
      sort: '-sent_at'
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Get email history error:', error);
    return [];
  }
}
