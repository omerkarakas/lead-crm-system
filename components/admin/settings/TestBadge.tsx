import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TestBadgeProps {
  result?: { success: boolean; message: string; timestamp?: number } | null;
  isLoading?: boolean;
}

export function TestBadge({ result, isLoading }: TestBadgeProps) {
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground" />
        <span>Test ediliyor...</span>
      </Badge>
    );
  }

  if (!result) {
    return (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        <span>Test edilmemiş</span>
      </Badge>
    );
  }

  if (result.success) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        <span>{result.message}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      <span>{result.message}</span>
    </Badge>
  );
}
