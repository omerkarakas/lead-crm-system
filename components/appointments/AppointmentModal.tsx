'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment } from '@/types/appointment';
import type { Lead } from '@/types/lead';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  appointment?: Appointment;
  preSelectedLeadId?: string;
  preSelectedLeadName?: string;
  initialDateTime?: string; // Format: "YYYY-MM-DDTHH:mm"
  existingAppointments?: Appointment[]; // For conflict detection
}

export function AppointmentModal({
  open,
  onOpenChange,
  onSuccess,
  appointment,
  preSelectedLeadId,
  preSelectedLeadName,
  initialDateTime,
  existingAppointments,
}: AppointmentModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Fetch leads when modal opens (both for create and edit)
  useEffect(() => {
    if (open) {
      // Skip fetching if we have preSelectedLeadId without leads array
      if (preSelectedLeadId && !appointment) {
        // Leads passed directly, no need to fetch
        return;
      }

      setLeadsLoading(true);
      fetch('/api/leads?perPage=100')
        .then((res) => res.json())
        .then((data) => {
          setLeads(data.items || []);
        })
        .catch((err) => {
          console.error('Error fetching leads:', err);
        })
        .finally(() => {
          setLeadsLoading(false);
        });
    }
  }, [open, appointment, preSelectedLeadId]);

  const handleSave = () => {
    onOpenChange(false);
    setLeads([]); // Reset leads for next open
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
    setLeads([]); // Reset leads for next open
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Randevu Düzenle' : 'Yeni Randevu Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {preSelectedLeadName
              ? `${preSelectedLeadName} için randevu ${appointment ? 'düzenleyin' : 'oluşturun'}`
              : appointment
              ? 'Randevu bilgilerini düzenleyin'
              : 'Müşteri adayı için randevu oluşturun'}
          </DialogDescription>
        </DialogHeader>

        {leadsLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AppointmentForm
            appointment={appointment}
            leads={leads}
            onSave={handleSave}
            onCancel={handleCancel}
            preSelectedLeadId={preSelectedLeadId}
            preSelectedLeadName={preSelectedLeadName}
            initialDateTime={initialDateTime}
            existingAppointments={existingAppointments}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
