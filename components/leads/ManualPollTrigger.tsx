'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface ManualPollTriggerProps {
  leadId: string;
  qaCompleted?: boolean;
}

export function ManualPollTrigger({ leadId, qaCompleted }: ManualPollTriggerProps) {
  const [loading, setLoading] = useState(false);

  const handleSendPoll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/send-poll`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send poll');
      }

      toast.success('Poll başarıyla gönderildi');
      // Refresh the page to show updated status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Poll gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendPoll}
      disabled={loading || qaCompleted}
      variant={qaCompleted ? 'outline' : 'default'}
    >
      {loading ? 'Gönderiliyor...' : qaCompleted ? 'Tamamlandı' : 'Tekrar Gönder'}
    </Button>
  );
}
