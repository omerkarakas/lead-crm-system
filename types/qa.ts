export interface QAQuestion {
  id: string;
  question_text: string;
  options: string[];  // ["a) Option 1", "b) Option 2", ...]
  points: Record<string, number>;  // {a: 30, b: 60, c: 100}
  order: number;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface CreateQAQuestionDto {
  question_text: string;
  options: string[];
  points: Record<string, number>;
  order: number;
  is_active?: boolean;
}

export interface UpdateQAQuestionDto {
  question_text?: string;
  options?: string[];
  points?: Record<string, number>;
  order?: number;
  is_active?: boolean;
}

export interface QAAnswer {
  id?: string;
  lead_id: string;
  question_id: string;
  selected_answer: string;  // "a", "b", or "c"
  points_earned: number;
  answered_at?: string;
}

export interface WhatsAppMessage {
  id?: string;
  lead_id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  message_type: 'poll' | 'booking_link' | 'info' | 'error';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  sent_at?: string;
  green_api_id?: string;
}
