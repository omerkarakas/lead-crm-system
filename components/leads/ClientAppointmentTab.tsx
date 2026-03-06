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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateAppointment = useCallback(() => {
    setIsAppointmentModalOpen(true);
  }, []);

  const handleCloseAppointmentModal = useCallback(() => {
    setIsAppointmentModalOpen(false);
  }, []);

  const handleAppointmentSuccess = useCallback(() => {
    // Trigger refresh of appointments list
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      <LeadAppointments
        key={refreshKey}
        leadId={leadId}
        onCreateAppointment={handleCreateAppointment}
      />

      <AppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={handleCloseAppointmentModal}
        onSuccess={handleAppointmentSuccess}
        preSelectedLeadId={leadId}
        preSelectedLeadName={leadName}
      />
    </>
  );
}
