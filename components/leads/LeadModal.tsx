'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeadForm, LeadFormValues } from './LeadForm';
import { Lead, CreateLeadDto, UpdateLeadDto, LeadSource, LeadStatus } from '@/types/lead';
import { useLeadsStore } from '@/lib/stores/leads';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  mode?: 'create' | 'edit';
}

export function LeadModal({ open, onOpenChange, lead, mode = 'create' }: LeadModalProps) {
  const { createLead, updateLead } = useLeadsStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = lead
    ? {
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        company: lead.company || '',
        website: lead.website || '',
        message: lead.message || '',
        source: lead.source,
        status: lead.status,
        tags: lead.tags,
        auto_updated_status: lead.auto_updated_status,
      }
    : undefined;

  const handleSubmit = async (data: LeadFormValues, force?: boolean) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create' && !lead) {
        const createData: CreateLeadDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          company: data.company || undefined,
          website: data.website || undefined,
          message: data.message || undefined,
          source: data.source,
          status: data.status,
          tags: data.tags || [],
        };
        const createdLead = await createLead(createData);

        // Trigger poll sending immediately after lead creation
        try {
          await fetch(`/api/leads/${createdLead.id}/send-poll`, {
            method: 'POST',
          });
          console.log('Poll triggered for lead:', createdLead.id);
        } catch (pollError) {
          console.error('Failed to trigger poll:', pollError);
          // Don't fail lead creation if poll fails
        }

        toast.success(`${data.name} başarıyla oluşturuldu.`);
      } else if (lead) {
        const updateData: UpdateLeadDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          company: data.company || undefined,
          website: data.website || undefined,
          message: data.message || undefined,
          source: data.source,
          status: data.status,
          tags: data.tags || [],
        };
        await updateLead(lead.id, updateData, { force, userRole: user?.role });
        toast.success(`${data.name} başarıyla güncellendi.`);
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Yeni Lead' : 'Lead Düzenle'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Yeni bir müşteri adayı oluşturun.'
              : 'Müşteri adayı bilgilerini düzenleyin.'}
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          defaultValues={defaultValues}
          mode={mode}
          userRole={user?.role}
        />
      </DialogContent>
    </Dialog>
  );
}
