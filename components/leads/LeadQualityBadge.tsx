import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { LeadQuality } from '@/types/lead';
import {
  getQualityBadgeColor,
  getQualityStatusLabel,
  formatScore
} from '@/lib/utils/lead-scoring';

interface LeadQualityBadgeProps {
  quality: LeadQuality;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function LeadQualityBadge({
  quality,
  score,
  showScore = true,
  size = 'md',
  showIcon = true
}: LeadQualityBadgeProps) {
  const colorClass = getQualityBadgeColor(quality);
  const label = getQualityStatusLabel(quality);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const Icon = quality === LeadQuality.QUALIFIED
    ? CheckCircle
    : quality === LeadQuality.PENDING
    ? Clock
    : AlertCircle;

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 opacity-75">
          {formatScore(score)}
        </span>
      )}
    </Badge>
  );
}

export default LeadQualityBadge;
