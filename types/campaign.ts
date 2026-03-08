/**
 * Campaign and Sequence types for multi-channel nurturing
 */

// Enums
export enum CampaignType {
  Email = 'email',
  WhatsApp = 'whatsapp'
}

export enum StepType {
  Email = 'email',
  WhatsApp = 'whatsapp',
  Delay = 'delay'
}

export enum DelayType {
  Relative = 'relative',
  Absolute = 'absolute'
}

export enum SegmentOperator {
  And = 'and',
  Or = 'or'
}

export enum RuleOperator {
  Eq = 'eq',
  Ne = 'ne',
  Gt = 'gt',
  Lt = 'lt',
  Gte = 'gte',
  Lte = 'lte',
  Contains = 'contains',
  NotContains = 'not_contains'
}

// Audience Segment
export interface SegmentRule {
  field: string;
  operator: RuleOperator;
  value: any;
}

export interface AudienceSegment {
  operator: SegmentOperator;
  rules: SegmentRule[];
}

// Sequence Steps
export interface CampaignStep {
  id: string;
  order: number;
  type: StepType;
  template_id?: string;
  delay_minutes?: number;
  delay_type?: DelayType;
  scheduled_time?: string;
}

// Alias for SequenceStep (used in builder context)
export type SequenceStep = CampaignStep;

// Builder View Mode
export enum BuilderViewMode {
  FlowChart = 'flowchart',
  Table = 'table'
}

// Sequence Builder State
export interface SequenceBuilderState {
  campaign_id?: string;
  sequence_id?: string;
  name: string;
  steps: SequenceStep[];
  viewMode: BuilderViewMode;
  isDirty: boolean;
}

// Step Validation Error
export interface StepValidationError {
  step_id: string;
  field: string;
  message: string;
}

// Step Form Data
export interface StepFormData {
  type: StepType;
  template_id?: string;
  delay_type?: DelayType;
  delay_minutes?: number;
  scheduled_time?: string;
}

// Reorder Action
export interface ReorderAction {
  from_index: number;
  to_index: number;
}

// Campaign
export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  audience_segment: AudienceSegment;
  auto_enroll_min_score?: number;
  is_active: boolean;
  created: string;
  updated: string;
}

// Sequence
export interface Sequence {
  id: string;
  campaign_id: string;
  name: string;
  steps: CampaignStep[];
  is_active: boolean;
  created: string;
  updated: string;
}

// DTOs
export interface CreateCampaignDto {
  name: string;
  description: string;
  type: CampaignType;
  audience_segment: AudienceSegment;
  auto_enroll_min_score?: number;
  is_active?: boolean;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  audience_segment?: AudienceSegment;
  auto_enroll_min_score?: number;
  is_active?: boolean;
}

export interface CreateSequenceDto {
  campaign_id: string;
  name: string;
  steps: CampaignStep[];
  is_active?: boolean;
}

export interface UpdateSequenceDto {
  name?: string;
  steps?: CampaignStep[];
  is_active?: boolean;
}

// Segment Preview
export interface SegmentPreview {
  count: number;
  sample_leads: {
    id: string;
    name: string;
    status: string;
    score: number;
  }[];
}

// Campaign with expanded sequences
export interface CampaignWithSequences extends Campaign {
  sequences?: Sequence[];
}

// Enrollment Status
export enum EnrollmentStatus {
  Active = 'active',
  Completed = 'completed',
  Failed = 'failed',
  Unsubscribed = 'unsubscribed'
}

// Campaign Enrollment
export interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  sequence_id: string;
  lead_id: string;
  status: EnrollmentStatus;
  current_step: number;
  enrolled_at: string;
  completed_at?: string;
  unsubscribed_at?: string;
  unsubscribe_token: string;
  created: string;
  updated: string;
  expand?: {
    campaign_id?: Campaign;
    sequence_id?: Sequence;
    lead_id?: any; // Lead type - imported from lead.ts to avoid circular dependency
  };
}

// Enrollment DTOs
export interface CreateEnrollmentDto {
  campaign_id: string;
  sequence_id: string;
  lead_id: string;
}

export interface UnsubscribeRequest {
  token: string;
  campaign_ids?: string[];
}

// Sequence Execution Types
export enum SequenceMessageStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed'
}

export interface SequenceMessage {
  id: string;
  enrollment_id: string;
  step_id: string;
  step_order: number;
  step_type: StepType;
  template_id?: string;
  status: SequenceMessageStatus;
  sent_at?: string;
  error_message?: string;
  created: string;
  updated: string;
}

export interface ExecutionResult {
  success: boolean;
  message_id?: string;
  error?: string;
}
