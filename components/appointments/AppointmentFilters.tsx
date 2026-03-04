'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppointmentStatus } from '@/types/appointment';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, Calendar } from 'lucide-react';

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  search?: string;
}

interface AppointmentFiltersProps {
  onFilterChange: (filters: AppointmentFilters) => void;
  loading?: boolean;
  initialFilters?: AppointmentFilters;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planlandı',
  [AppointmentStatus.COMPLETED]: 'Tamamlandı',
  [AppointmentStatus.CANCELLED]: 'İptal',
  [AppointmentStatus.RESCHEDULED]: 'Yeniden Planlandı',
};

// Default to next 30 days
const getDefaultDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  return {
    startDate: today.toISOString().split('T')[0],
    endDate: thirtyDaysLater.toISOString().split('T')[0],
  };
};

export function AppointmentFilters({
  onFilterChange,
  loading = false,
  initialFilters,
}: AppointmentFiltersProps) {
  const [filters, setFilters] = useState<AppointmentFilters>(() => {
    const defaults = getDefaultDateRange();
    return {
      startDate: initialFilters?.startDate || defaults.startDate,
      endDate: initialFilters?.endDate || defaults.endDate,
      status: initialFilters?.status,
      search: initialFilters?.search || '',
    };
  });

  const [searchInput, setSearchInput] = useState(initialFilters?.search || '');

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        const newFilters = { ...filters, search: searchInput || undefined };
        setFilters(newFilters);
        onFilterChange(newFilters);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStartDateChange = useCallback((value: string) => {
    const newFilters = { ...filters, startDate: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const handleEndDateChange = useCallback((value: string) => {
    const newFilters = { ...filters, endDate: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const handleStatusChange = useCallback((value: string) => {
    const newFilters = {
      ...filters,
      status: value === 'all' ? undefined : (value as AppointmentStatus),
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    const defaults = getDefaultDateRange();
    const newFilters: AppointmentFilters = {
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      status: undefined,
      search: undefined,
    };
    setFilters(newFilters);
    setSearchInput('');
    onFilterChange(newFilters);
  }, [onFilterChange]);

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.search
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtreler</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date" className="text-xs">
            Başlangıç Tarihi
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="start-date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-xs">
            Bitiş Tarihi
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="end-date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-xs">
            Durum
          </Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
            disabled={loading}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search-input" className="text-xs">
            Ara
          </Label>
          <Input
            id="search-input"
            type="text"
            placeholder="İsim veya telefon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  );
}
