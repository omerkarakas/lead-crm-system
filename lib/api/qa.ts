import PocketBase from 'pocketbase';
import type {
  QAQuestion,
  CreateQAQuestionDto,
  UpdateQAQuestionDto,
  QAAnswer,
  QuestionType,
  CreateSingleChoiceDto,
  CreateMultipleChoiceDto,
  CreateLikertDto,
  CreateOpenDto,
  CreateQAQuestionDtoLegacy,
} from '@/types/qa';

// Create dedicated PocketBase instance for QA to prevent auto-cancellation
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
 * Fetch all questions (ordered by order field)
 */
export async function fetchQuestions(): Promise<QAQuestion[]> {
  try {
    const response = await pb.collection('qa_questions').getList<QAQuestion>(1, 100, {
      sort: 'order',
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Fetch questions error:', error);
    return [];
  }
}

/**
 * Fetch only active questions (ordered by order field)
 */
export async function fetchActiveQuestions(): Promise<QAQuestion[]> {
  try {
    const response = await pb.collection('qa_questions').getList<QAQuestion>(1, 100, {
      filter: 'is_active = true',
      sort: 'order',
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Fetch active questions error:', error);
    return [];
  }
}

/**
 * Fetch a single question by ID
 */
export async function fetchQuestion(id: string): Promise<QAQuestion> {
  return await pb.collection('qa_questions').getOne<QAQuestion>(id);
}

/**
 * Create a new question with validation
 */
export async function createQuestion(data: CreateQAQuestionDto): Promise<QAQuestion> {
  // Validate the data based on question type
  validateQuestionData(data);

  // Build the record object
  const recordData: any = {
    question_text: data.question_text,
    order: data.order,
    is_active: data.is_active ?? true,
    question_type: data.question_type,
  };

  // Add type-specific fields
  if (data.question_type === 'single' || data.question_type === 'multiple') {
    recordData.options = data.options;
    recordData.points = data.points;
    if (data.question_type === 'multiple') {
      recordData.max_selections = (data as CreateMultipleChoiceDto).max_selections;
    }
  } else if (data.question_type === 'likert') {
    const likertData = data as CreateLikertDto;
    recordData.scale_min = likertData.scale_min;
    recordData.scale_max = likertData.scale_max;
    recordData.scale_labels = likertData.scale_labels;
    recordData.points_per_level = likertData.points_per_level;
  } else if (data.question_type === 'open') {
    const openData = data as CreateOpenDto;
    recordData.max_length = openData.max_length;
    recordData.min_length = openData.min_length;
    recordData.points = openData.points;
  }

  const record = await pb.collection('qa_questions').create<QAQuestion>(recordData);
  return record;
}

/**
 * Create a new question (legacy version for backward compatibility)
 */
export async function createQuestionLegacy(data: CreateQAQuestionDtoLegacy): Promise<QAQuestion> {
  const questionType = data.question_type ?? 'single';

  const recordData: any = {
    question_text: data.question_text,
    options: data.options,
    points: data.points,
    order: data.order,
    is_active: data.is_active ?? true,
    question_type: questionType,
  };

  const record = await pb.collection('qa_questions').create<QAQuestion>(recordData);
  return record;
}

/**
 * Update an existing question
 */
export async function updateQuestion(id: string, data: UpdateQAQuestionDto): Promise<QAQuestion> {
  return await pb.collection('qa_questions').update<QAQuestion>(id, data);
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string): Promise<void> {
  await pb.collection('qa_questions').delete(id);
}

/**
 * Toggle question active status
 */
export async function toggleQuestionActive(id: string, isActive: boolean): Promise<QAQuestion> {
  // Directly update with explicit boolean value
  const activeValue = isActive === true;
  console.log('[toggleQuestionActive] Sending:', { id, isActive, activeValue });
  return await pb.collection('qa_questions').update<QAQuestion>(id, {
    is_active: activeValue
  });
}

/**
 * Reorder questions (update order field for multiple questions)
 */
export async function reorderQuestions(questions: QAQuestion[]): Promise<void> {
  // Update each question's order field
  await Promise.all(
    questions.map((q, index) =>
      pb.collection('qa_questions').update(q.id, { order: index + 1 })
    )
  );
}

/**
 * Save an answer to qa_answers collection with validation
 */
export async function saveAnswer(answer: QAAnswer): Promise<QAAnswer> {
  // Fetch the question to validate against
  let question: QAQuestion | null = null;
  if (answer.question_id) {
    try {
      question = await fetchQuestion(answer.question_id);
    } catch (error) {
      console.warn('[saveAnswer] Could not fetch question for validation:', error);
    }
  }

  // Validate answer if we have the question
  if (question) {
    validateAnswerData(question, answer);
  }

  // Format selected_answer for storage (convert arrays to JSON strings for multiple choice)
  let storedAnswer: string;
  if (Array.isArray(answer.selected_answer)) {
    storedAnswer = JSON.stringify(answer.selected_answer);
  } else if (typeof answer.selected_answer === 'number') {
    storedAnswer = String(answer.selected_answer);
  } else {
    storedAnswer = String(answer.selected_answer);
  }

  const record = await pb.collection('qa_answers').create<QAAnswer>({
    lead_id: answer.lead_id,
    question_id: answer.question_id,
    selected_answer: storedAnswer,
    points_earned: answer.points_earned,
    answered_at: answer.answered_at || new Date().toISOString()
  });

  return record;
}

/**
 * Save an answer and automatically calculate points
 */
export async function saveAnswerWithPoints(
  questionId: string,
  leadId: string,
  selectedAnswer: string | string[] | number
): Promise<QAAnswer> {
  const question = await fetchQuestion(questionId);

  const answerPartial: Partial<QAAnswer> = {
    lead_id: leadId,
    question_id: questionId,
    selected_answer: selectedAnswer as any,
  };

  // Validate the answer
  validateAnswerData(question, answerPartial);

  // Calculate points automatically
  const pointsEarned = calculatePointsEarned(question, answerPartial);

  // Save the answer
  return saveAnswer({
    lead_id: leadId,
    question_id: questionId,
    selected_answer: selectedAnswer as any,
    points_earned: pointsEarned,
    answered_at: new Date().toISOString(),
  });
}

/**
 * Get lead's answers with question expansion
 */
export async function getLeadAnswers(leadId: string): Promise<QAAnswer[]> {
  try {
    const response = await pb.collection('qa_answers').getList<QAAnswer>(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: 'answered_at',
      expand: 'question_id'
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Get lead answers error:', error);
    return [];
  }
}

/**
 * Calculate total score for a lead from their answers
 */
export async function calculateLeadTotalScore(leadId: string): Promise<number> {
  const answers = await getLeadAnswers(leadId);
  return answers.reduce((total, answer) => total + (answer.points_earned || 0), 0);
}

/**
 * Delete all QA answers for a lead
 */
export async function deleteLeadQAAnswers(leadId: string): Promise<void> {
  try {
    const answers = await pb.collection('qa_answers').getList(1, 100, {
      filter: `lead_id = "${leadId}"`
    });

    for (const answer of answers.items) {
      await pb.collection('qa_answers').delete(answer.id);
    }

    console.log(`[deleteLeadQAAnswers] Deleted ${answers.items.length} answers for lead: ${leadId}`);
  } catch (error) {
    console.error('[deleteLeadQAAnswers] Error:', error);
    throw error;
  }
}

/**
 * Extended answer type with question data
 */
export interface QAAnswerWithQuestion extends QAAnswer {
  expand?: {
    question_id?: QAQuestion;
  };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validation error class
 */
export class QuestionValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'QuestionValidationError';
  }
}

/**
 * Validate single choice question data
 */
function validateSingleChoice(data: CreateSingleChoiceDto): void {
  if (!data.options || data.options.length < 2) {
    throw new QuestionValidationError(
      'Single choice questions must have at least 2 options',
      'options',
      'INVALID_OPTIONS_COUNT'
    );
  }

  if (!data.points || typeof data.points !== 'object') {
    throw new QuestionValidationError(
      'Points must be an object mapping option keys to values',
      'points',
      'INVALID_POINTS_FORMAT'
    );
  }

  // Validate that all option keys have points
  const optionKeys = data.options.map((_, i) => String.fromCharCode(97 + i)); // a, b, c, ...
  for (const key of optionKeys) {
    if (!(key in data.points)) {
      throw new QuestionValidationError(
        `Missing points for option "${key}"`,
        'points',
        'MISSING_POINTS_FOR_OPTION'
      );
    }
  }
}

/**
 * Validate multiple choice question data
 */
function validateMultipleChoice(data: CreateMultipleChoiceDto): void {
  if (!data.options || data.options.length < 2) {
    throw new QuestionValidationError(
      'Multiple choice questions must have at least 2 options',
      'options',
      'INVALID_OPTIONS_COUNT'
    );
  }

  if (!data.points || typeof data.points !== 'object') {
    throw new QuestionValidationError(
      'Points must be an object mapping option values to points',
      'points',
      'INVALID_POINTS_FORMAT'
    );
  }

  if (data.max_selections !== undefined && data.max_selections < 1) {
    throw new QuestionValidationError(
      'max_selections must be at least 1',
      'max_selections',
      'INVALID_MAX_SELECTIONS'
    );
  }

  if (data.max_selections !== undefined && data.max_selections > data.options.length) {
    throw new QuestionValidationError(
      'max_selections cannot exceed number of options',
      'max_selections',
      'MAX_SELECTIONS_EXCEEDS_OPTIONS'
    );
  }
}

/**
 * Validate Likert scale question data
 */
function validateLikert(data: CreateLikertDto): void {
  const scaleMin = data.scale_min ?? 1;
  const scaleMax = data.scale_max ?? 5;

  if (scaleMin < 1) {
    throw new QuestionValidationError(
      'scale_min must be at least 1',
      'scale_min',
      'INVALID_SCALE_MIN'
    );
  }

  if (scaleMax > 10) {
    throw new QuestionValidationError(
      'scale_max cannot exceed 10',
      'scale_max',
      'INVALID_SCALE_MAX'
    );
  }

  if (scaleMin >= scaleMax) {
    throw new QuestionValidationError(
      'scale_max must be greater than scale_min',
      'scale_max',
      'INVALID_SCALE_RANGE'
    );
  }

  if (data.points_per_level !== undefined && data.points_per_level < 0) {
    throw new QuestionValidationError(
      'points_per_level must be non-negative',
      'points_per_level',
      'INVALID_POINTS_PER_LEVEL'
    );
  }
}

/**
 * Validate open-ended question data
 */
function validateOpen(data: CreateOpenDto): void {
  if (data.min_length !== undefined && data.min_length < 0) {
    throw new QuestionValidationError(
      'min_length must be non-negative',
      'min_length',
      'INVALID_MIN_LENGTH'
    );
  }

  if (data.max_length !== undefined && data.max_length < 1) {
    throw new QuestionValidationError(
      'max_length must be at least 1',
      'max_length',
      'INVALID_MAX_LENGTH'
    );
  }

  if (
    data.min_length !== undefined &&
    data.max_length !== undefined &&
    data.min_length > data.max_length
  ) {
    throw new QuestionValidationError(
      'min_length cannot exceed max_length',
      'min_length',
      'INVALID_LENGTH_RANGE'
    );
  }

  if (data.points !== undefined && data.points < 0) {
    throw new QuestionValidationError(
      'points must be non-negative',
      'points',
      'INVALID_POINTS'
    );
  }
}

/**
 * Validate question data based on question type
 */
export function validateQuestionData(data: CreateQAQuestionDto): void {
  // Validate common fields
  if (!data.question_text || data.question_text.trim().length === 0) {
    throw new QuestionValidationError(
      'Question text is required',
      'question_text',
      'MISSING_QUESTION_TEXT'
    );
  }

  if (data.question_text.length > 500) {
    throw new QuestionValidationError(
      'Question text cannot exceed 500 characters',
      'question_text',
      'QUESTION_TEXT_TOO_LONG'
    );
  }

  // Validate type-specific fields
  switch (data.question_type) {
    case 'single':
      validateSingleChoice(data as CreateSingleChoiceDto);
      break;
    case 'multiple':
      validateMultipleChoice(data as CreateMultipleChoiceDto);
      break;
    case 'likert':
      validateLikert(data as CreateLikertDto);
      break;
    case 'open':
      validateOpen(data as CreateOpenDto);
      break;
    default:
      throw new QuestionValidationError(
        `Invalid question_type: ${(data as any).question_type}`,
        'question_type',
        'INVALID_QUESTION_TYPE'
      );
  }
}

/**
 * Validate answer data based on question type
 */
export function validateAnswerData(
  question: QAQuestion,
  answer: Partial<QAAnswer>
): void {
  if (!answer.selected_answer && answer.selected_answer !== 0) {
    throw new QuestionValidationError(
      'Answer is required',
      'selected_answer',
      'MISSING_ANSWER'
    );
  }

  switch (question.question_type) {
    case 'single': {
      const answerStr = String(answer.selected_answer);
      const validKeys = question.options.map((_, i) =>
        String.fromCharCode(97 + i)
      );
      if (!validKeys.includes(answerStr)) {
        throw new QuestionValidationError(
          `Invalid answer. Must be one of: ${validKeys.join(', ')}`,
          'selected_answer',
          'INVALID_SINGLE_CHOICE_ANSWER'
        );
      }
      break;
    }

    case 'multiple': {
      if (!Array.isArray(answer.selected_answer)) {
        throw new QuestionValidationError(
          'Multiple choice answer must be an array',
          'selected_answer',
          'INVALID_MULTIPLE_CHOICE_FORMAT'
        );
      }

      if (answer.selected_answer.length === 0) {
        throw new QuestionValidationError(
          'At least one option must be selected',
          'selected_answer',
          'NO_SELECTIONS'
        );
      }

      const maxSel = (question as any).max_selections ?? question.options.length;
      if (answer.selected_answer.length > maxSel) {
        throw new QuestionValidationError(
          `Cannot select more than ${maxSel} options`,
          'selected_answer',
          'TOO_MANY_SELECTIONS'
        );
      }

      // Validate that all selected options exist
      for (const selected of answer.selected_answer) {
        if (!question.options.includes(selected)) {
          throw new QuestionValidationError(
            `Invalid option selected: ${selected}`,
            'selected_answer',
            'INVALID_OPTION_SELECTED'
          );
        }
      }
      break;
    }

    case 'likert': {
      const scaleMin = (question as any).scale_min ?? 1;
      const scaleMax = (question as any).scale_max ?? 5;
      const answerNum = Number(answer.selected_answer);

      if (isNaN(answerNum)) {
        throw new QuestionValidationError(
          'Likert answer must be a number',
          'selected_answer',
          'INVALID_LIKERT_FORMAT'
        );
      }

      if (answerNum < scaleMin || answerNum > scaleMax) {
        throw new QuestionValidationError(
          `Answer must be between ${scaleMin} and ${scaleMax}`,
          'selected_answer',
          'LIKERT_OUT_OF_RANGE'
        );
      }
      break;
    }

    case 'open': {
      const answerStr = String(answer.selected_answer);
      const minLength = (question as any).min_length ?? 0;
      const maxLength = (question as any).max_length ?? 5000;

      if (answerStr.length < minLength) {
        throw new QuestionValidationError(
          `Answer must be at least ${minLength} characters`,
          'selected_answer',
          'ANSWER_TOO_SHORT'
        );
      }

      if (answerStr.length > maxLength) {
        throw new QuestionValidationError(
          `Answer cannot exceed ${maxLength} characters`,
          'selected_answer',
          'ANSWER_TOO_LONG'
        );
      }
      break;
    }

    default:
      throw new QuestionValidationError(
        `Unknown question type: ${(question as any).question_type}`,
        'question_type',
        'UNKNOWN_QUESTION_TYPE'
      );
  }
}

/**
 * Calculate points earned for an answer based on question type
 */
export function calculatePointsEarned(
  question: QAQuestion,
  answer: Partial<QAAnswer>
): number {
  switch (question.question_type) {
    case 'single': {
      const key = String(answer.selected_answer);
      return question.points[key] ?? 0;
    }

    case 'multiple': {
      if (!Array.isArray(answer.selected_answer)) return 0;
      return answer.selected_answer.reduce((total, selected) => {
        return total + (question.points[selected] ?? 0);
      }, 0);
    }

    case 'likert': {
      const pointsPerLevel = (question as any).points_per_level ?? 0;
      const answerNum = Number(answer.selected_answer);
      if (isNaN(answerNum)) return 0;
      return answerNum * pointsPerLevel;
    }

    case 'open': {
      return (question as any).points ?? 0;
    }

    default:
      return 0;
  }
}
