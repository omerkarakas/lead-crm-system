import { Badge } from '@/components/ui/badge';

export interface QualityBadgeProps {
  quality: 'qualified' | 'pending';
}

export function QualityBadge({ quality }: QualityBadgeProps) {
  const variants = {
    qualified: 'default',
    pending: 'secondary'
  } as const;

  const labels = {
    qualified: 'Qualified',
    pending: 'Pending'
  };

  return (
    <Badge variant={variants[quality]}>
      {labels[quality]}
    </Badge>
  );
}
