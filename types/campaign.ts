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
