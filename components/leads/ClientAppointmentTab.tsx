'use client';

import { useState, useCallback } from 'react';
import { LeadAppointments } from '@/components/appointments/LeadAppointments';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';

interface ClientAppointmentTabProps {
  leadId: string;
  leadName: string;
}

export function ClientAppointmentTab({ leadId, leadName }: ClientAppointmentTabProps) {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const handleCreateAppointment = useCallback(() => {
    setIsAppointmentModalOpen(true);
  }, []);

  const handleCloseAppointmentModal = useCallback(() => {
    setIsAppointmentModalOpen(false);
  }, []);

  return (
    <>
      <LeadAppointments
        leadId={leadId}
        onCreateAppointment={handleCreateAppointment}
      />

      <AppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={handleCloseAppointmentModal}
        preSelectedLeadId={leadId}
        preSelectedLeadName={leadName}
      />
    </>
  );
}
