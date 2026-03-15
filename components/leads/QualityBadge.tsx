import { Badge } from '@/components/ui/badge';

export interface QualityBadgeProps {
  quality: 'qualified' | 'pending' | 'followup';
}

export function QualityBadge({ quality }: QualityBadgeProps) {
  const variants = {
    qualified: 'default',
    pending: 'secondary',
    followup: 'outline'
  } as const;

  const labels = {
    qualified: 'Kalifiye',
    pending: 'Beklemede',
    followup: 'Takip Gerekli'
  };

  return (
    <Badge variant={variants[quality]}>
      {labels[quality]}
    </Badge>
  );
}
