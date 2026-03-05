import { QA_CONFIG } from '@/lib/config/qa-constants';
import { QualityBadge } from './QualityBadge';

export interface ScoreDisplayProps {
  totalScore: number;
  quality: 'qualified' | 'pending';
  breakdown?: Array<{
    question: string;
    answer: string;
    points: number;
  }>;
}

export function ScoreDisplay({ totalScore, quality, breakdown }: ScoreDisplayProps) {
  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Qualification Skoru</h3>
        <QualityBadge quality={quality} />
      </div>

      <div className="text-3xl font-bold mb-4">
        {totalScore} <span className="text-sm text-gray-500">/ {QA_CONFIG.qualityScoreThreshold}</span>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Detaylı Skor</h4>
          {breakdown.map((item, index) => (
            <div key={index} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{item.question}</span>
              <span className="font-medium text-green-600">+{item.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
