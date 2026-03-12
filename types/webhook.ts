import { LeadStatus, LeadSource } from '@/types/lead';

// Lead creation via webhook
export interface WebhookLeadCreateDto {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  source?: LeadSource;
  status?: LeadStatus;
  tags?: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// Lead status update via webhook
export interface WebhookStatusUpdateDto {
  status: LeadStatus;
  force?: boolean; // Override auto-updated status
  reason?: string; // Optional reason for status change
}

// Webhook response
export interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Webhook error types
export enum WebhookErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  LEAD_NOT_FOUND = 'LEAD_NOT_FOUND',
  DUPLICATE_LEAD = 'DUPLICATE_LEAD',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Webhook error response
export interface WebhookErrorResponse {
  success: false;
  error: WebhookErrorType;
  message: string;
  details?: any;
}

// Webhook authentication methods
export enum WebhookAuthMethod {
  API_KEY = 'api_key',
  HMAC_SIGNATURE = 'hmac_signature',
  BEARER_TOKEN = 'bearer_token'
}

// Webhook authentication config
export interface WebhookAuthConfig {
  method: WebhookAuthMethod;
  apiKey?: string;
  secret?: string;
  headerName?: string;
}
