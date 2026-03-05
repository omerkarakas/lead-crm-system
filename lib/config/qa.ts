/**
 * QA Configuration Constants
 */

import PocketBase from 'pocketbase';
import { getServerPb } from '../pocketbase/server';

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

// In-memory cache for booking link to avoid repeated database queries
let cachedBookingLink: string | null = null;

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

/**
 * Get booking link for qualified leads from database
 */
export async function getBookingLink(pb?: PocketBase): Promise<string> {
  // Return cached value if available
  if (cachedBookingLink) {
    return cachedBookingLink;
  }

  try {
    const pocketbase = pb || await getServerPb();

    // Query for booking_link_url setting
    const result = await pocketbase.collection('app_settings').getList(1, 1, {
      filter: `service_name = "calcom" && setting_key = "booking_link_url" && is_active = true`
    });

    if (result.totalItems > 0 && result.items[0]) {
      const link = result.items[0].setting_value;
      // Cache the result
      cachedBookingLink = link;
      return link;
    }

    // Fallback to default if not found in database
    return QA_CONFIG.defaultBookingLink;
  } catch (error) {
    console.error('Error fetching booking link from database:', error);
    // Return fallback on error
    return QA_CONFIG.defaultBookingLink;
  }
}

/**
 * Clear the cached booking link (useful after updating the setting)
 */
export function clearBookingLinkCache(): void {
  cachedBookingLink = null;
}
