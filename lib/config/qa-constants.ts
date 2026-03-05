/**
 * QA Configuration Constants
 * This file contains only constants and can be imported by client components
 */

export const QA_CONFIG = {
  // Default welcome message template
  welcomeMessage: 'Merhaba {name}! 👋\n\nBaşvurunuz için teşekkürler. Size yardımcı olabilmemiz için birkaç soru:',

  // Footer message for poll format
  pollFooter: '\n\nCevapları "1a, 2b" formatında yazabilirsiniz.',

  // Default booking link (fallback if database is not available)
  defaultBookingLink: 'https://cal.mokadijital.com/moka/30min',

  // Quality score threshold (leads above this score are qualified)
  qualityScoreThreshold: 80,

  // Maximum questions per poll
  maxQuestionsPerPoll: 2,

  // Point mappings (a: low, b: medium, c: high)
  defaultPoints: {
    a: 30,
    b: 60,
    c: 100,
  },
} as const;

/**
 * Format welcome message with lead data
 */
export function formatWelcomeMessage(name: string, company?: string): string {
  let message = QA_CONFIG.welcomeMessage.replace(/{name}/g, name);

  if (company) {
    message = message.replace(/{company}/g, company);
  } else {
    message = message.replace(/{company}/g, '');
  }

  return message;
}

/**
 * Format poll message with questions
 */
export function formatPollMessage(questions: Array<{ question_text: string; options: string[]; order: number }>): string {
  let message = '';

  for (const question of questions) {
    message += `*${question.order}. ${question.question_text}*\n\n`;
    message += question.options.join('\n');
    message += '\n\n';
  }

  return message + QA_CONFIG.pollFooter;
}

/**
 * Calculate total score from answers
 */
export function calculateScore(answers: Array<{ selected_answer: string; points: Record<string, number> }>): number {
  return answers.reduce((total, answer) => {
    const points = answer.points[answer.selected_answer] || 0;
    return total + points;
  }, 0);
}

/**
 * Check if lead is qualified based on score
 */
export function isQualified(score: number): boolean {
  return score >= QA_CONFIG.qualityScoreThreshold;
}
