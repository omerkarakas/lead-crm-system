import pb from '@/lib/pocketbase';
import type {
  QAQuestion,
  CreateQAQuestionDto,
  UpdateQAQuestionDto,
  QAAnswer,
} from '@/types/qa';

/**
 * Fetch all questions (ordered by order field)
 */
export async function fetchQuestions(): Promise<QAQuestion[]> {
  const response = await pb.collection('qa_questions').getList<QAQuestion>(1, 100, {
    sort: 'order',
  });

  return response.items;
}

/**
 * Fetch only active questions (ordered by order field)
 */
export async function fetchActiveQuestions(): Promise<QAQuestion[]> {
  const response = await pb.collection('qa_questions').getList<QAQuestion>(1, 100, {
    filter: 'is_active = true',
    sort: 'order',
  });

  return response.items;
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
  return await updateQuestion(id, { is_active: isActive });
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
 * Save an answer (for future use when we create answers collection)
 */
export async function saveAnswer(answer: QAAnswer): Promise<QAAnswer> {
  // This will be implemented when we create the qa_answers collection
  // For now, return a mock response
  return answer;
}

/**
 * Get lead's answers (for future use)
 */
export async function getLeadAnswers(leadId: string): Promise<QAAnswer[]> {
  // This will be implemented when we create the qa_answers collection
  // For now, return empty array
  return [];
}
