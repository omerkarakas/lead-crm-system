import { QAQuestion, SingleChoiceQuestion, MultipleChoiceQuestion } from "@/types/qa";
import type { Lead } from "@/types/lead";
import { QA_CONFIG } from "@/lib/config/qa";

/**
 * Format poll message for WhatsApp
 * NOTE: This is used for legacy text-based polls.
 * New SendPoll approach sends questions individually.
 */
export function formatPollMessage(lead: Lead, questions: QAQuestion[]): string {
  // Format welcome message
  let welcome = QA_CONFIG.welcomeMessage.replace("{name}", lead.name || "Değerli Müşterimiz");
  welcome = welcome.replace("{soru_sayisi}", String(questions.length));

  if (lead.company) {
    welcome = welcome.replace("{company}", lead.company);
  } else {
    welcome = welcome.replace("{company}", "");
  }

  // Format questions - only single/multiple choice have options
  const questionsText = questions
    .map((q, index) => {
      const num = index + 1;

      // Handle different question types
      if (q.question_type === 'single' || q.question_type === 'multiple') {
        const choiceQ = q as SingleChoiceQuestion | MultipleChoiceQuestion;
        const options = choiceQ.options.join("\n   ");
        return `${num}. ${q.question_text}\n   ${options}`;
      } else if (q.question_type === 'likert') {
        // For Likert, show the scale values
        const scaleValues = (q as any).scale_values || [];
        const scaleOptions = scaleValues.map((v: any) => `${v.value}) ${v.label}`).join("\n   ");
        return `${num}. ${q.question_text}\n   ${scaleOptions}`;
      } else {
        // Open-ended - no options
        return `${num}. ${q.question_text}\n   (Cevabınızı yazın...)`;
      }
    })
    .join("\n\n");

  return welcome + "\n\n" + questionsText + QA_CONFIG.pollFooter;
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
  return `Cevap formatı hatalı. Lütfen "1a, 2c, 3b" formatında yazın. Örnek: 1a:birinci sorunun ilk seçeneği, 2c:ikinci sorunun üçüncü seçeneği gibi`;
}
