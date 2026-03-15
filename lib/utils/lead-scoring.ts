import { LeadQuality } from '@/types/lead';

export const QUALIFIED_SCORE_THRESHOLD = 80;

/**
 * QA tamamlanmadıysa PENDING döner
 * QA tamamlandıysa skora göre QUALIFIED veya FOLLOWUP döner
 */
export function calculateQualityStatus(score: number, qaCompleted?: boolean): LeadQuality {
  // QA tamamlanmadıysa beklemede göster
  if (!qaCompleted) {
    return LeadQuality.PENDING;
  }
  // QA tamamlandıysa skora göre karar ver
  if (score >= QUALIFIED_SCORE_THRESHOLD) {
    return LeadQuality.QUALIFIED;
  }
  return LeadQuality.FOLLOWUP;
}

export function getQualityBadgeColor(quality: LeadQuality): string {
  switch (quality) {
    case LeadQuality.QUALIFIED:
      return 'bg-green-100 text-green-800 border-green-200';
    case LeadQuality.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case LeadQuality.FOLLOWUP:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getQualityStatusLabel(quality: LeadQuality): string {
  switch (quality) {
    case LeadQuality.QUALIFIED:
      return 'Kalifiye';
    case LeadQuality.PENDING:
      return 'Beklemede';
    case LeadQuality.FOLLOWUP:
      return 'Takip';
    default:
      return 'Bilinmiyor';
  }
}

export function formatScore(score: number, totalScore = 100): string {
  return `${score}/${totalScore}`;
}

export function isQualified(score: number): boolean {
  return score >= QUALIFIED_SCORE_THRESHOLD;
}

export function getScorePercentage(score: number, totalScore = 100): number {
  return Math.min(100, Math.max(0, (score / totalScore) * 100));
}
