'use client';

import { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  Send,
  Check,
  X,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { formatAppointmentDate, formatAppointmentTime } from '@/lib/utils/appointment';
import { AppointmentDetailProposalTab } from '@/components/appointments/AppointmentDetailProposalTab';

interface AppointmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment & { expand?: { lead_id?: any } } | null;
  onEdit?: (appointment: Appointment) => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => Promise<void>;
  onSendConfirmation?: (id: string) => Promise<void>;
  loading?: boolean;
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

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  onEdit,
  onUpdateStatus,
  onSendConfirmation,
  loading = false,
}: AppointmentDetailModalProps) {
  const [actionLoading, setActionLoading] = useState(false);

  if (!appointment) {
    return null;
  }

  const lead = appointment.expand?.lead_id;

  const handleStatusUpdate = async (status: AppointmentStatus) => {
    if (!onUpdateStatus) return;
    setActionLoading(true);
    try {
      await onUpdateStatus(appointment.id, status);
      onClose();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!onSendConfirmation) return;
    setActionLoading(true);
    try {
      await onSendConfirmation(appointment.id);
    } catch (error) {
      console.error('Error sending confirmation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const canUpdateStatus = appointment.status === AppointmentStatus.SCHEDULED;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Randevu Detayları</DialogTitle>
          <DialogDescription>
            Randevu bilgileri ve işlemleri
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="details">Detaylar</TabsTrigger>
            <TabsTrigger value="proposals">Teklif</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-6">
          {/* Lead Info Section */}
          {lead && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Müşteri Adayı</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lead.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = `/leads/${lead.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Detay
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <span>{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div>{lead.email}</div>
                  )}
                  {lead.company && (
                    <div>{lead.company}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-border my-4" />

          {/* Date and Time */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Tarih ve Saat</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatAppointmentDate(appointment.scheduled_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatAppointmentTime(appointment.scheduled_at)}</span>
              </div>
              {appointment.duration && (
                <Badge variant="outline">{appointment.duration} dakika</Badge>
              )}
            </div>
          </div>

          {/* Location */}
          {(appointment.location || appointment.meeting_url) && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Konum</h3>
                {appointment.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.meeting_url && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={appointment.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Toplantı Linki
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="h-px bg-border my-4" />

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Durum</h3>
            <Badge variant={STATUS_VARIANTS[appointment.status]} className="font-medium">
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notlar
                </h3>
                <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <div className="h-px bg-border my-4" />
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>Oluşturulma: {new Date(appointment.created).toLocaleString('tr-TR')}</div>
            <div>Güncelleme: {new Date(appointment.updated).toLocaleString('tr-TR')}</div>
          </div>

          {/* Confirmation Status */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              <span className="text-muted-foreground">
                Onay: {appointment.confirmation_sent ? 'Gönderildi' : 'Gönderilmedi'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                24s Hatırlatma: {appointment.reminder_24h_sent ? 'Gönderildi' : 'Bekliyor'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                2s Hatırlatma: {appointment.reminder_2h_sent ? 'Gönderildi' : 'Bekliyor'}
              </span>
            </div>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="proposals" className="mt-4">
            <AppointmentDetailProposalTab
              appointmentId={appointment.id}
              leadId={lead?.id}
              leadName={lead?.name}
              leadPhone={lead?.phone}
              leadCompany={lead?.company}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => onEdit(appointment)}
              disabled={loading || actionLoading}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          )}

          {onSendConfirmation && !appointment.confirmation_sent && (
            <Button
              variant="outline"
              onClick={handleSendConfirmation}
              disabled={loading || actionLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Onay Gönder
            </Button>
          )}

          {canUpdateStatus && onUpdateStatus && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(AppointmentStatus.COMPLETED)}
                disabled={loading || actionLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Tamamlandı
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(AppointmentStatus.CANCELLED)}
                disabled={loading || actionLoading}
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading || actionLoading}
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
