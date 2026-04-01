// Question type discriminator
export type QuestionType = 'single' | 'multiple' | 'likert' | 'open';

// Base question interface with common fields
export interface BaseQAQuestion {
  id: string;
  question_text: string;
  order: number;
  is_active: boolean;
  created: string;
  updated: string;
}

// Single choice question (original a/b/c format)
export interface SingleChoiceQuestion extends BaseQAQuestion {
  question_type: 'single';
  options: string[];  // ["a) Option 1", "b) Option 2", ...]
  points: Record<string, number>;  // {a: 30, b: 60, c: 100}
}

// Multiple choice question (checkboxes)
export interface MultipleChoiceQuestion extends BaseQAQuestion {
  question_type: 'multiple';
  options: string[];  // ["Option 1", "Option 2", ...]
  points: Record<string, number>;  // {option1: 10, option2: 20, ...}
  max_selections?: number;  // Optional limit on selections
}

// Likert scale question (1-5 rating)
export interface LikertQuestion extends BaseQAQuestion {
  question_type: 'likert';
  scale_min?: number;  // Default 1
  scale_max?: number;  // Default 5
  scale_labels?: {
    min?: string;  // e.g., "Very dissatisfied"
    max?: string;  // e.g., "Very satisfied"
  };
  points_per_level?: number;  // Points per scale level
}

// Open-ended question
export interface OpenQuestion extends BaseQAQuestion {
  question_type: 'open';
  max_length?: number;  // Optional character limit
  min_length?: number;  // Optional minimum length
  points?: number;  // Fixed points for any answer
}

// Discriminated union for all question types
export type QAQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | LikertQuestion
  | OpenQuestion;

// Backward compatible type alias
export interface QAQuestionLegacy {
  id: string;
  question_text: string;
  options: string[];
  points: Record<string, number>;
  order: number;
  is_active: boolean;
  created: string;
  updated: string;
  question_type?: QuestionType;
}

// Base DTO with common fields
export interface BaseCreateQuestionDto {
  question_text: string;
  order: number;
  is_active?: boolean;
}

// DTOs for creating each question type
export interface CreateSingleChoiceDto extends BaseCreateQuestionDto {
  question_type: 'single';
  options: string[];
  points: Record<string, number>;
}

export interface CreateMultipleChoiceDto extends BaseCreateQuestionDto {
  question_type: 'multiple';
  options: string[];
  points: Record<string, number>;
  max_selections?: number;
}

export interface CreateLikertDto extends BaseCreateQuestionDto {
  question_type: 'likert';
  scale_min?: number;
  scale_max?: number;
  scale_labels?: {
    min?: string;
    max?: string;
  };
  points_per_level?: number;
}

export interface CreateOpenDto extends BaseCreateQuestionDto {
  question_type: 'open';
  max_length?: number;
  min_length?: number;
  points?: number;
}

// Union type for creating any question
export type CreateQAQuestionDto =
  | CreateSingleChoiceDto
  | CreateMultipleChoiceDto
  | CreateLikertDto
  | CreateOpenDto;

// Backward compatible DTO (defaults to single choice)
export interface CreateQAQuestionDtoLegacy {
  question_text: string;
  options: string[];
  points: Record<string, number>;
  order: number;
  is_active?: boolean;
  question_type?: QuestionType;
}

// Update DTOs (all fields optional)
export interface UpdateSingleChoiceDto {
  question_type?: 'single';
  question_text?: string;
  options?: string[];
  points?: Record<string, number>;
  order?: number;
  is_active?: boolean;
}

export interface UpdateMultipleChoiceDto {
  question_type?: 'multiple';
  question_text?: string;
  options?: string[];
  points?: Record<string, number>;
  max_selections?: number;
  order?: number;
  is_active?: boolean;
}

export interface UpdateLikertDto {
  question_type?: 'likert';
  question_text?: string;
  scale_min?: number;
  scale_max?: number;
  scale_labels?: {
    min?: string;
    max?: string;
  };
  points_per_level?: number;
  order?: number;
  is_active?: boolean;
}

export interface UpdateOpenDto {
  question_type?: 'open';
  question_text?: string;
  max_length?: number;
  min_length?: number;
  points?: number;
  order?: number;
  is_active?: boolean;
}

export type UpdateQAQuestionDto =
  | UpdateSingleChoiceDto
  | UpdateMultipleChoiceDto
  | UpdateLikertDto
  | UpdateOpenDto;

// Answer types based on question type
export type SingleChoiceAnswer = string;  // "a", "b", "c"
export type MultipleChoiceAnswer = string[];  // ["option1", "option2"]
export type LikertAnswer = number;  // 1-5
export type OpenAnswer = string;  // Text response

// Discriminated union for answers
export interface BaseQAAnswer {
  id?: string;
  lead_id: string;
  question_id?: string;
  points_earned: number;
  answered_at?: string;
}

export interface SingleChoiceQAAnswer extends BaseQAAnswer {
  question_type: 'single';
  selected_answer: SingleChoiceAnswer;
}

export interface MultipleChoiceQAAnswer extends BaseQAAnswer {
  question_type: 'multiple';
  selected_answer: MultipleChoiceAnswer;
}

export interface LikertQAAnswer extends BaseQAAnswer {
  question_type: 'likert';
  selected_answer: LikertAnswer;
}

export interface OpenQAAnswer extends BaseQAAnswer {
  question_type: 'open';
  selected_answer: OpenAnswer;
}

export type QAAnswer =
  | SingleChoiceQAAnswer
  | MultipleChoiceQAAnswer
  | LikertQAAnswer
  | OpenQAAnswer;

// Backward compatible answer type
export interface QAAnswerLegacy {
  id?: string;
  lead_id: string;
  question_id?: string;
  selected_answer: string;
  points_earned: number;
  answered_at?: string;
  question_type?: QuestionType;
}

export interface WhatsAppMessage {
  id?: string;
  lead_id: string;
  direction: 'incoming' | 'outgoing';
  message_text: string;
  message_type: 'poll' | 'booking_link' | 'info' | 'error' | 'text';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  sent_at?: string;
  green_api_id?: string;
}

export interface QAAnswerWithQuestion extends QAAnswer {
  expand?: {
    question_id?: QAQuestion;
  };
}

// Type aliases for WhatsApp message properties
export type WhatsAppDirection = 'incoming' | 'outgoing';
export type WhatsAppMessageType = 'poll' | 'booking_link' | 'info' | 'error' | 'text';
export type WhatsAppStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'received';
