'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, TrendingUp, Award } from 'lucide-react';
import { LeadQuality } from '@/types/lead';
import {
  QUALIFIED_SCORE_THRESHOLD,
  calculateQualityStatus,
  getScorePercentage,
  getQualityStatusLabel,
  getQualityBadgeColor
} from '@/lib/utils/lead-scoring';
import { LeadQualityBadge } from '@/components/leads/LeadQualityBadge';

interface ScoreBreakdown {
  questionNumber: number;
  questionText: string;
  selectedOption: string;  // e.g., "a"
  selectedOptionText: string;  // e.g., "a) Yıllık 1M+ TL ciro"
  points: number;
}

interface ScoreDisplayProps {
  totalScore: number;
  quality: LeadQuality;
  breakdown?: ScoreBreakdown[];
  maxScore?: number;
  qaCompleted?: boolean;
}

export function ScoreDisplay({
  totalScore,
  quality,
  breakdown = [],
  maxScore = 100,
  qaCompleted = false
}: ScoreDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculatedQuality = calculateQualityStatus(totalScore, qaCompleted);
  const scorePercentage = getScorePercentage(totalScore, maxScore);
  const isQualified = totalScore >= QUALIFIED_SCORE_THRESHOLD;

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Skor</h3>
        <LeadQualityBadge
          quality={calculatedQuality}
          score={totalScore}
          showIcon={true}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - scorePercentage / 100)}`}
              className={isQualified ? 'text-green-500' : 'text-yellow-500'}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{totalScore}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Kalite Durumu</span>
              <span className="font-medium">{getQualityStatusLabel(calculatedQuality)}</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {breakdown.length > 0 && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  Detayları Gör
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Skor Detayları</DialogTitle>
                  <DialogDescription>
                    Toplam Skor: {totalScore}/{maxScore} - {getQualityStatusLabel(calculatedQuality)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Toplam Soru</p>
                        <p className="text-2xl font-bold">{breakdown.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Kalite Durumu</p>
                        <p className="text-2xl font-bold">
                          {getQualityStatusLabel(calculatedQuality)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Soru Bazlı Detaylar</h4>
                    {breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                            {item.questionNumber}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="font-medium">{item.questionText}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Seçim:</span>
                              <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                {item.selectedOptionText}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={item.points > 0 ? 'default' : 'secondary'}
                            className={item.points > 0 ? 'bg-green-100 text-green-800' : ''}
                          >
                            +{item.points} puan
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-gray-500">
          {isQualified ? (
            <span className="text-green-600">
              ✓ Bu lead kalifiye statüsünde (≥{QUALIFIED_SCORE_THRESHOLD} puan)
            </span>
          ) : (
            <span className="text-yellow-600">
              ⏳ Kalifiye olmak için {QUALIFIED_SCORE_THRESHOLD - totalScore} puan daha gerekli
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default ScoreDisplay;
