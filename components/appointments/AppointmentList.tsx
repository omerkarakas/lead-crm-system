'use client';

import { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, AppointmentSource } from '@/types/appointment';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Eye, Pencil, Trash2, Table as TableIcon, LayoutGrid } from 'lucide-react';
import { formatAppointmentDate, formatAppointmentTime, formatAppointmentDateTime } from '@/lib/utils/appointment';

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onDetail?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planlandı',
  [AppointmentStatus.COMPLETED]: 'Tamamlandı',
  [AppointmentStatus.CANCELLED]: 'İptal',
  [AppointmentStatus.RESCHEDULED]: 'Yeniden Planlandı',
};

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [AppointmentStatus.SCHEDULED]: 'default',
  [AppointmentStatus.COMPLETED]: 'secondary',
  [AppointmentStatus.CANCELLED]: 'destructive',
  [AppointmentStatus.RESCHEDULED]: 'outline',
};

const SOURCE_LABELS: Record<AppointmentSource, string> = {
  [AppointmentSource.CALCOM]: 'Cal.com',
  [AppointmentSource.MANUAL]: 'Manuel',
};

type ViewMode = 'table' | 'card';

const STORAGE_KEY = 'appointment-view-mode';

function getViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'table';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'card' || stored === 'table') ? stored : 'table';
  } catch {
    return 'table';
  }
}

function setViewMode(mode: ViewMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    console.error('Failed to save view mode:', error);
  }
}

export function AppointmentList({
  appointments,
  loading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onDetail,
  onEdit,
  onDelete,
}: AppointmentListProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>('table');

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedMode = getViewMode();
    setViewModeState(savedMode);
  }, []);

  const handleViewToggle = () => {
    const newMode = viewMode === 'table' ? 'card' : 'table';
    setViewModeState(newMode);
    setViewMode(newMode);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-2">Randevu bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            Farklı arama kriterleri deneyin veya filtreleri temizleyin
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Toplam {totalItems} randevu
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Önceki
        </Button>
        <span className="text-sm">
          Sayfa {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sonraki
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm text-muted-foreground">
        {totalItems} randevu gösteriliyor
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewToggle}
        className="gap-2"
      >
        {viewMode === 'table' ? (
          <>
            <LayoutGrid className="h-4 w-4" />
            Kart Görünümü
          </>
        ) : (
          <>
            <TableIcon className="h-4 w-4" />
            Tablo Görünümü
          </>
        )}
      </Button>
    </div>
  );

  // Card View Component
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDetail?.(appointment)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {appointment.expand?.lead_id && (
              <h3 className="font-semibold text-lg">
                {appointment.expand.lead_id.name}
              </h3>
            )}
            <p className="text-sm text-muted-foreground">
              {formatAppointmentDateTime(appointment.scheduled_at)}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[appointment.status]} className="font-medium">
            {STATUS_LABELS[appointment.status]}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          {appointment.expand?.lead_id && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{appointment.expand.lead_id.phone}</span>
              {appointment.expand.lead_id.company && (
                <span>• {appointment.expand.lead_id.company}</span>
              )}
            </div>
          )}

          {appointment.location && (
            <div className="text-muted-foreground">
              📍 {appointment.location}
            </div>
          )}

          {appointment.meeting_url && (
            <div className="text-blue-600">
              🔗 Toplantı Linki
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              {SOURCE_LABELS[appointment.source]}
            </Badge>
            {appointment.duration && (
              <Badge variant="outline" className="text-xs">
                {appointment.duration}dk
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {renderHeader()}

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih ve Saat</TableHead>
                <TableHead>Müşteri Adayı</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Kaynak</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                const lead = appointment.expand?.lead_id;
                return (
                  <TableRow
                    key={appointment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onDetail?.(appointment)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatAppointmentDate(appointment.scheduled_at)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatAppointmentTime(appointment.scheduled_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead?.name || '-'}
                    </TableCell>
                    <TableCell>{lead?.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[appointment.status]} className="font-medium">
                        {STATUS_LABELS[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.location ? (
                        <span className="text-sm">📍 {appointment.location}</span>
                      ) : appointment.meeting_url ? (
                        <span className="text-sm text-blue-600">🔗 Online</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {SOURCE_LABELS[appointment.source]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetail?.(appointment);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="p-4">
            {renderPagination()}
          </div>
        </Card>
      )}

      {/* Mobile Card View */}
      <div className={viewMode === 'card' ? 'space-y-4' : 'md:hidden space-y-4'}>
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
        <div className="flex justify-center">
          {renderPagination()}
        </div>
      </div>
    </>
  );
}
