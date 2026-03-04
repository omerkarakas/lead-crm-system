'use client';

import { Button } from '@/components/ui/button';
import { Table, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'table' | 'card';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center border rounded-md p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('table')}
        className={cn(
          'h-7 px-2',
          viewMode === 'table' && 'bg-accent'
        )}
      >
        <Table className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('card')}
        className={cn(
          'h-7 px-2',
          viewMode === 'card' && 'bg-accent'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
