// Activity Types
export enum ActivityType {
  Note = 'note',
  WhatsApp = 'whatsapp',
  Email = 'email',
  StatusChange = 'status_change',
  QAAnswer = 'qa_answer',
  Appointment = 'appointment',
  TagAdded = 'tag_added',
  TagRemoved = 'tag_removed',
  LeadCreated = 'lead_created',
  ProposalSent = 'proposal_sent',
  ProposalResponse = 'proposal_response',
  CampaignEnrolled = 'campaign_enrolled'
}

// Base Activity Event
export interface BaseActivityEvent {
  id: string;
  type: ActivityType;
  timestamp: string;
  leadId: string;
}

// Note Event
export interface NoteEvent extends BaseActivityEvent {
  type: ActivityType.Note;
  content: string;
  userId: string;
  userName?: string;
}

// WhatsApp Event
export interface WhatsAppEvent extends BaseActivityEvent {
  type: ActivityType.WhatsApp;
  direction: 'incoming' | 'outgoing';
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  messageType?: 'text' | 'poll' | 'template';
}

// Email Event
export interface EmailEvent extends BaseActivityEvent {
  type: ActivityType.Email;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  templateId?: string;
  templateName?: string;
}

// Status Change Event
export interface StatusChangeEvent extends BaseActivityEvent {
  type: ActivityType.StatusChange;
  oldStatus: string;
  newStatus: string;
  autoUpdated: boolean;
}

// QA Answer Event
export interface QAAnswerEvent extends BaseActivityEvent {
  type: ActivityType.QAAnswer;
  question: string;
  answer: string;
  pointsEarned: number;
}

// Appointment Event
export interface AppointmentEvent extends BaseActivityEvent {
  type: ActivityType.Appointment;
  action: 'created' | 'updated' | 'cancelled' | 'completed';
  scheduledAt: string;
  status: string;
}

// Proposal Event
export interface ProposalEvent extends BaseActivityEvent {
  type: ActivityType.ProposalSent | ActivityType.ProposalResponse;
  proposalId?: string;
  templateName?: string;
  response?: 'CEVAP_BEKLENIYOR' | 'KABUL' | 'RED';
}

// Campaign Enrollment Event
export interface CampaignEnrollmentEvent extends BaseActivityEvent {
  type: ActivityType.CampaignEnrolled;
  campaignId: string;
  campaignName: string;
  sequenceCount: number;
}

// Tag Event
export interface TagEvent extends BaseActivityEvent {
  type: ActivityType.TagAdded | ActivityType.TagRemoved;
  tag: string;
}

// Union Type
export type ActivityEvent =
  | NoteEvent
  | WhatsAppEvent
  | EmailEvent
  | StatusChangeEvent
  | QAAnswerEvent
  | AppointmentEvent
  | ProposalEvent
  | CampaignEnrollmentEvent
  | TagEvent;

// Timeline Filters
export interface TimelineFilters {
  types: ActivityType[];
  startDate?: string;
  endDate?: string;
}

// Timeline Response
export interface TimelineResponse {
  events: ActivityEvent[];
  total: number;
  hasMore: boolean;
}
