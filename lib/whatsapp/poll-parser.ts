/**
 * Parse poll answers from WhatsApp message
 * Supports formats like:
 * - "1a, 2b" (numbered with answers)
 * - "1a2b" (concatenated)
 * - "ab" (implicit order - a for Q1, b for Q2)
 * - "a b" (space separated, implicit order)
 * - "1a 2b" (space separated)
 */

export function parsePollAnswer(message: string): Record<number, string> | null {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const clean = message.toLowerCase().trim().replace(/[^a-z0-9]/gi, '');

  if (clean.length === 0) {
    return null;
  }

  const result: Record<number, string> = {};

  // Try format 1: "1a2b" (numbered with answers)
  const format1Regex = /(\d)([abc])/g;
  let match;
  let found = false;
  while ((match = format1Regex.exec(clean)) !== null) {
    const questionIndex = parseInt(match[1]) - 1; // 1-indexed to 0-indexed
    const answer = match[2];
    result[questionIndex] = answer;
    found = true;
  }

  if (found && Object.keys(result).length > 0) {
    return result;
  }

  // Try format 2: "ab" (implicit order - a for Q1, b for Q2)
  if (/^[abc]+$/.test(clean)) {
    for (let i = 0; i < clean.length; i++) {
      result[i] = clean[i];
    }
    return result;
  }

  return null; // Invalid format
}

/**
 * Validate if the parsed answers are valid
 * Checks if all question indices are within bounds
 */
export function validateAnswers(
  answers: Record<number, string>,
  questionCount: number
): boolean {
  for (const [questionIndex, answer] of Object.entries(answers)) {
    const qIndex = parseInt(questionIndex);

    // Check if question index is valid
    if (qIndex < 0 || qIndex >= questionCount) {
      return false;
    }

    // Check if answer is valid
    if (!['a', 'b', 'c'].includes(answer)) {
      return false;
    }
  }

  return true;
}

/**
 * Format answers for display
 */
export function formatAnswersForDisplay(answers: Record<number, string>): string {
  const sortedEntries = Object.entries(answers)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  return sortedEntries
    .map(([qIndex, answer]) => `${parseInt(qIndex) + 1}${answer}`)
    .join(', ');
}
