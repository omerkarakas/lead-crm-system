/**
 * Email types for Resend integration
 */

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export enum EmailDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

export interface EmailMessage {
  id: string;
  lead_id: string;
  to_email: string;
  subject: string;
  body: string;
  template_id?: string;
  direction: EmailDirection;
  status: EmailStatus;
  sent_at?: string;
  resend_message_id?: string;
  created: string;
  updated: string;
}

export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailToLeadDto {
  template_id?: string;
  subject?: string;
  body?: string;
}

export interface ResendResponse {
  id: string;
}

export interface ResendErrorResponse {
  name?: string;
  message?: string;
  statusCode?: number;
}

// Email Template types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  is_active: boolean;
  is_deleted: boolean;
  created: string;
  updated: string;
}

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  body: string;
  category?: string;
  is_active?: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  category?: string;
  is_active?: boolean;
}
