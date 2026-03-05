export enum LeadStatus {
  NEW = 'new',
  QUALIFIED = 'qualified',
  BOOKED = 'booked',
  CUSTOMER = 'customer',
  LOST = 'lost',
  RE_APPLY = 're-apply'
}

export enum LeadSource {
  WEB_FORM = 'web_form',
  API = 'api',
  MANUAL = 'manual',
  WHATSAPP = 'whatsapp'
}

export enum LeadQuality {
  PENDING = 'pending',
  QUALIFIED = 'qualified'
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  total_score?: number;
  quality: LeadQuality;
  tags: string[];
  createdBy?: string;
  qa_sent: boolean;
  qa_sent_at?: string;
  qa_completed: boolean;
  qa_completed_at?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_timestamp?: string;
  created: string;
  updated: string;
}

export interface CreateLeadDto {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  source: LeadSource;
  status?: LeadStatus;
  score?: number;
  quality?: LeadQuality;
  tags?: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_timestamp?: string;
}

export interface UpdateLeadDto {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  source?: LeadSource;
  status?: LeadStatus;
  score?: number;
  total_score?: number;
  quality?: LeadQuality;
  tags?: string[];
  qa_sent?: boolean;
  qa_sent_at?: string;
  qa_completed?: boolean;
  qa_completed_at?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_timestamp?: string;
}

export interface Note {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  created: string;
  updated: string;
  expand?: {
    userId?: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  };
}

export interface CreateNoteDto {
  leadId: string;
  content: string;
}

export interface LeadsResponse {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: Lead[];
}

export interface LeadsListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: LeadStatus;
  tags?: string[];
  sort?: string;
}
