import PocketBase from 'pocketbase';
import type {
  QAQuestion,
  CreateQAQuestionDto,
  UpdateQAQuestionDto,
  QAAnswer,
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
 * Create a new question
 */
export async function createQuestion(data: CreateQAQuestionDto): Promise<QAQuestion> {
  const record = await pb.collection('qa_questions').create<QAQuestion>({
    question_text: data.question_text,
    options: data.options,
    points: data.points,
    order: data.order,
    is_active: data.is_active ?? true,
  });

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
 * Save an answer to qa_answers collection
 */
export async function saveAnswer(answer: QAAnswer): Promise<QAAnswer> {
  const record = await pb.collection('qa_answers').create<QAAnswer>({
    lead_id: answer.lead_id,
    question_id: answer.question_id,
    selected_answer: answer.selected_answer,
    points_earned: answer.points_earned,
    answered_at: answer.answered_at || new Date().toISOString()
  });

  return record;
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
