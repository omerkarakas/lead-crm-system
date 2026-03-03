import { QAQuestion } from '@/types/qa';
import type { Lead } from '@/types/lead';
import { QA_CONFIG } from '@/lib/config/qa';

/**
 * Format poll message for WhatsApp
 */
export function formatPollMessage(lead: Lead, questions: QAQuestion[]): string {
  // Format welcome message
  let welcome = QA_CONFIG.welcomeMessage.replace('{name}', lead.name || 'Değerli Müşterimiz');

  if (lead.company) {
    welcome = welcome.replace('{company}', lead.company);
  } else {
    welcome = welcome.replace('{company}', '');
  }

  // Format questions
  const questionsText = questions.map((q, index) => {
    const num = index + 1;
    const options = q.options.join('\n   ');
    return `${num}. ${q.question_text}\n   ${options}`;
  }).join('\n\n');

  return welcome + '\n\n' + questionsText + QA_CONFIG.pollFooter;
}

/**
 * Format booking link message for qualified leads
 */
export function formatBookingLinkMessage(meetingUrl: string): string {
  return `🎉 Harika! Randevunuzu oluşturmak için aşağıdaki linki kullanabilirsiniz:\n\n${meetingUrl}\n\nGörüşmek üzere!`;
}

/**
 * Format low quality message for non-qualified leads
 */
export function formatLowQualityMessage(): string {
  return `Teşekkürler! Başvurunuz incelendi. En kısa sürede size dönüş yapacağız. 🙏`;
}

/**
 * Format retry message for invalid answer format
 */
export function formatRetryMessage(): string {
  return `Cevap formatı hatalı. Lütfen "1a, 2b" formatında yazın. Örnek: 1a için ilk seçenek, 2b için ikinci sorunun ikinci seçeneği.`;
}
