'use client';

import { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { LeadStatus } from '@/types/lead';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  RefreshCw,
} from 'lucide-react';
import { formatAppointmentDate, formatAppointmentTime } from '@/lib/utils/appointment';
import { AppointmentDetailProposalTab } from '@/components/appointments/AppointmentDetailProposalTab';
import { toast } from 'sonner';

interface AppointmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment & { expand?: { lead_id?: any } } | null;
  onEdit?: (appointment: Appointment) => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => Promise<void>;
  onSendConfirmation?: (id: string) => Promise<void>;
  loading?: boolean;
  isAdmin?: boolean;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planlandı',
  [AppointmentStatus.COMPLETED]: 'Tamamlandı',
  [AppointmentStatus.CANCELLED]: 'İptal',
  [AppointmentStatus.RESCHEDULED]: 'Yeniden Planlandı',
  [AppointmentStatus.NO_SHOW]: 'Gelmedi',
};

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [AppointmentStatus.SCHEDULED]: 'default',
  [AppointmentStatus.COMPLETED]: 'secondary',
  [AppointmentStatus.CANCELLED]: 'destructive',
  [AppointmentStatus.RESCHEDULED]: 'outline',
  [AppointmentStatus.NO_SHOW]: 'secondary',
};

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Nitelikli',
  [LeadStatus.BOOKED]: 'Randevu alındı',
  [LeadStatus.CUSTOMER]: 'Müşteri',
  [LeadStatus.LOST]: 'Kaybedildi',
  [LeadStatus.RE_APPLY]: 'Yeniden başvuru',
};

const LEAD_STATUS_VARIANTS: Record<LeadStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [LeadStatus.NEW]: 'default',
  [LeadStatus.QUALIFIED]: 'secondary',
  [LeadStatus.BOOKED]: 'outline',
  [LeadStatus.CUSTOMER]: 'default',
  [LeadStatus.LOST]: 'destructive',
  [LeadStatus.RE_APPLY]: 'outline',
};

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  onEdit,
  onUpdateStatus,
  onSendConfirmation,
  loading = false,
  isAdmin = false,
}: AppointmentDetailModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusOverride, setShowStatusOverride] = useState(false);
  const [statusOverrideLoading, setStatusOverrideLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [forceOverride, setForceOverride] = useState(false);

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

  const handleStatusOverride = async () => {
    if (!lead || !selectedStatus) {
      toast.error('Lütfen durum seçin');
      return;
    }

    setStatusOverrideLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          status: selectedStatus,
          reason: statusReason || undefined,
          force: forceOverride,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.warning) {
          toast.error(data.warning);
          return;
        }
        throw new Error(data.error || 'Durum güncellenirken hata oluştu');
      }

      toast.success(`Durum güncellendi: ${LEAD_STATUS_LABELS[selectedStatus]}`);
      setShowStatusOverride(false);
      setSelectedStatus('');
      setStatusReason('');
      setForceOverride(false);

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Durum güncellenirken hata oluştu');
    } finally {
      setStatusOverrideLoading(false);
    }
  };

  const canUpdateStatus = appointment.status === AppointmentStatus.SCHEDULED;

  // Check if lead status was auto-updated from proposal
  const isAutoUpdated = lead?.offer_response &&
    (lead.offer_response === 'kabul' || lead.offer_response === 'red') &&
    (lead.status === 'customer' || lead.status === 'lost');

  const statusReasonText = isAutoUpdated
    ? lead.offer_response === 'kabul'
      ? '(Teklif kabul edildi)'
      : '(Teklif reddedildi)'
    : null;

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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Müşteri Adayı</h3>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusOverride(true)}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Durum Güncelle
                  </Button>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lead.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={LEAD_STATUS_VARIANTS[lead.status as LeadStatus] || 'default'} className="font-medium">
                      {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                    </Badge>
                    {statusReasonText && (
                      <span className="text-xs text-muted-foreground">{statusReasonText}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/leads/${lead.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                  </div>
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
            <div>Oluşturulma: {new Date(appointment.created).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</div>
            <div>Güncelleme: {new Date(appointment.updated).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</div>
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

        {/* Status Override Dialog */}
        {isAdmin && showStatusOverride && lead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Lead Durumu Güncelle</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="status-select">Yeni Durum</Label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as LeadStatus)}>
                    <SelectTrigger id="status-select">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-reason">Açıklama (isteğe bağlı)</Label>
                  <Textarea
                    id="status-reason"
                    placeholder="Durum değişikliği nedeni..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {isAutoUpdated && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <input
                      type="checkbox"
                      id="force-override"
                      checked={forceOverride}
                      onChange={(e) => setForceOverride(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="force-override" className="text-sm font-medium text-yellow-800">
                        Zorla
                      </Label>
                      <p className="text-xs text-yellow-700 mt-1">
                        Bu durum otomatik olarak teklif yanıtından güncellendi. Değiştirmek için işaretleyin.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusOverride(false);
                    setSelectedStatus('');
                    setStatusReason('');
                    setForceOverride(false);
                  }}
                  disabled={statusOverrideLoading}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleStatusOverride}
                  disabled={statusOverrideLoading || !selectedStatus || (isAutoUpdated && !forceOverride)}
                  className="flex-1"
                >
                  {statusOverrideLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
