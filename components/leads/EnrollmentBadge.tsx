import { Badge } from '@/components/ui/badge';

interface EnrollmentBadgeProps {
  enrollmentCount: number;
  onClick?: () => void;
}

/**
 * Badge showing enrollment count with color coding
 * - Gray: 0 enrollments
 * - Blue: 1-3 enrollments
 * - Green: 4+ enrollments
 */
export function EnrollmentBadge({ enrollmentCount, onClick }: EnrollmentBadgeProps) {
  const getVariant = (): 'default' | 'secondary' | 'outline' => {
    if (enrollmentCount === 0) return 'secondary';
    if (enrollmentCount <= 3) return 'default';
    return 'outline';
  };

  const getColorClass = () => {
    if (enrollmentCount === 0) return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    if (enrollmentCount <= 3) return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
    return 'bg-green-100 text-green-700 hover:bg-green-200';
  };

  return (
    <Badge
      variant={getVariant()}
      className={`cursor-pointer ${getColorClass()}`}
      onClick={onClick}
    >
      {enrollmentCount} Kampanya
    </Badge>
  );
}
