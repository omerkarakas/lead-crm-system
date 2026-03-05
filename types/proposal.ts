export enum ProposalResponse {
  CEVAP_BEKLENIYOR = 'cevap_bekleniyor',
  KABUL = 'kabul',
  RED = 'red'
}

export enum EditorType {
  TIPTAP = 'tiptap',
  MARKDOWN = 'markdown'
}

export interface TemplateVariable {
  name: string;
  label: string;
  description: string;
  default_value?: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  editor_type: EditorType;
  variables: TemplateVariable[];
  is_active: boolean;
  is_deleted: boolean;
  created: string;
  updated: string;
}

export interface CreateProposalTemplateDto {
  name: string;
  description?: string;
  content: string;
  editor_type?: EditorType;
  variables?: TemplateVariable[];
  is_active?: boolean;
}

export interface UpdateProposalTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  editor_type?: EditorType;
  variables?: TemplateVariable[];
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface Proposal {
  id: string;
  lead_id: string;
  template_id: string;
  content: string;
  filled_content: string;
  variables_used: Record<string, string>;
  token: string;
  expires_at: string;
  response: ProposalResponse;
  response_comment?: string;
  responded_at?: string;
  created: string;
  updated: string;
  expand?: {
    lead_id?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      company?: string;
    };
    template_id?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

export interface CreateProposalDto {
  lead_id: string;
  template_id: string;
  variables?: Record<string, string>;
  expires_in_days?: number;
}

export interface GenerateProposalOptions {
  lead: Lead;
  template: ProposalTemplate;
  variables?: Record<string, string>;
  expiresInDays?: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
}

export interface ProposalPreviewData {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  budget?: string;
  appointment_date?: string;
  appointment_time?: string;
  website?: string;
  message?: string;
}
