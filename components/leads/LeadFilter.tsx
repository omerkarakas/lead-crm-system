'use client';

import { LeadStatus } from '@/types/lead';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface LeadFilterProps {
  statusFilter: LeadStatus | undefined;
  onStatusChange: (status: LeadStatus | undefined) => void;
  tagFilter: string | undefined;
  availableTags: string[];
  onTagChange: (tag: string | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Uygun',
  [LeadStatus.BOOKED]: 'Randevu',
  [LeadStatus.CUSTOMER]: 'Müşteri',
  [LeadStatus.LOST]: 'Kayıp',
};

export function LeadFilter({
  statusFilter,
  onStatusChange,
  tagFilter,
  availableTags,
  onTagChange,
  onClearFilters,
  hasActiveFilters,
}: LeadFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as LeadStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {availableTags.length > 0 && (
          <Select
            value={tagFilter || 'all'}
            onValueChange={(value) => onTagChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Etiket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Etiketler</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Temizle
          </Button>
        )}
      </div>
    </div>
  );
}
