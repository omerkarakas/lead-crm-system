'use client';

import { useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarPlus, Video, MapPin } from 'lucide-react';
import { formatAppointmentDate, formatAppointmentTime } from '@/lib/utils/appointment';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { getAppointmentsByLead, updateAppointmentStatus, sendAppointmentConfirmation } from '@/lib/api/appointments';

interface LeadAppointmentsProps {
  leadId: string;
  onCreateAppointment: () => void;
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

export function LeadAppointments({ leadId, onCreateAppointment }: LeadAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment & { expand?: { lead_id?: any } } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppointmentsByLead(leadId);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchAppointments();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const handleDetail = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment as any);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(null);
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    setActionLoading(true);
    try {
      await updateAppointmentStatus(id, status);
      await fetchAppointments();
      handleCloseDetailModal();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [fetchAppointments, handleCloseDetailModal]);

  const handleSendConfirmation = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      await sendAppointmentConfirmation(id);
      await fetchAppointments();
    } catch (error) {
      console.error('Error sending confirmation:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [fetchAppointments]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Henüz randevu yok</p>
          <Button onClick={onCreateAppointment}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Randevu Oluştur
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Create Appointment Button */}
        <div className="flex justify-end">
          <Button size="sm" onClick={onCreateAppointment}>
            <CalendarAdd className="mr-2 h-4 w-4" />
            Randevu Oluştur
          </Button>
        </div>

        {/* Appointments List */}
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleDetail(appointment)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold">
                        {formatAppointmentDate(appointment.scheduled_at)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAppointmentTime(appointment.scheduled_at)}
                      </div>
                      {appointment.duration && (
                        <Badge variant="outline" className="text-xs">
                          {appointment.duration}dk
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {appointment.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.location}
                        </div>
                      )}
                      {appointment.meeting_url && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Video className="h-3 w-3" />
                          Online Toplantı
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <Badge variant={STATUS_VARIANTS[appointment.status]} className="font-medium">
                    {STATUS_LABELS[appointment.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AppointmentDetailModal
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        appointment={selectedAppointment}
        onUpdateStatus={handleUpdateStatus}
        onSendConfirmation={handleSendConfirmation}
        loading={actionLoading}
      />
    </>
  );
}
