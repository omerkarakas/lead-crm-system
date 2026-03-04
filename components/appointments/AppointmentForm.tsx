'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { AppointmentStatus, AppointmentSource, type Appointment } from '@/types/appointment';
import { toast } from 'sonner';

// Form validation schema
const appointmentFormSchema = z.object({
  lead_id: z.string().min(1, 'Müşteri adayı seçilmelidir'),
  scheduled_at: z.string().min(1, 'Tarih ve saat seçilmelidir'),
  duration: z.string().min(1, 'Süre seçilmelidir'),
  location: z.string().max(255, 'Konum en fazla 255 karakter olabilir').optional(),
  meeting_url: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notlar en fazla 1000 karakter olabilir').optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
}

interface AppointmentFormProps {
  appointment?: Appointment;
  leads: Lead[];
  onSave: () => void;
  onCancel: () => void;
  preSelectedLeadId?: string;
  preSelectedLeadName?: string;
}

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: '15', label: '15 dakika' },
  { value: '30', label: '30 dakika' },
  { value: '45', label: '45 dakika' },
  { value: '60', label: '60 dakika' },
  { value: '90', label: '90 dakika' },
  { value: '120', label: '120 dakika' },
];

export function AppointmentForm({
  appointment,
  leads,
  onSave,
  onCancel,
  preSelectedLeadId,
  preSelectedLeadName,
}: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Initialize form with default values or appointment data for edit
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      lead_id: appointment?.lead_id || preSelectedLeadId || '',
      scheduled_at: appointment
        ? new Date(appointment.scheduled_at)
            .toISOString()
            .slice(0, 16) // Format for datetime-local input
        : '',
      duration: appointment?.duration?.toString() || '60',
      location: appointment?.location || '',
      meeting_url: appointment?.meeting_url || '',
      notes: appointment?.notes || '',
    },
  });

  // Fetch leads when component mounts (if not pre-selected and no leads provided)
  useEffect(() => {
    if (!preSelectedLeadId && (!leads || leads.length === 0)) {
      setLeadsLoading(true);
      fetch('/api/leads?perPage=100')
        .then((res) => res.json())
        .then((data) => {
          // Update the leads in parent by calling a callback would be ideal
          // For now, we'll just log that leads were fetched
          console.log('Leads fetched:', data.items?.length || 0);
        })
        .catch((err) => {
          console.error('Error fetching leads:', err);
          toast.error('Müşteri adayları yüklenirken hata oluştu');
        })
        .finally(() => {
          setLeadsLoading(false);
        });
    }
  }, [preSelectedLeadId, leads]);

  const onSubmit = async (values: AppointmentFormValues) => {
    setLoading(true);

    try {
      // Convert datetime-local format to ISO 8601
      // Input: "2026-03-04T16:19" -> Output: "2026-03-04T16:19:00.000Z"
      const scheduledAtISO = values.scheduled_at
        ? new Date(values.scheduled_at + ':00').toISOString()
        : '';

      if (appointment) {
        // Edit mode - PATCH to update existing appointment
        const updateData: Record<string, unknown> = {
          scheduled_at: scheduledAtISO,
          duration: parseInt(values.duration, 10),
        };

        if (values.location) updateData.location = values.location;
        if (values.meeting_url) updateData.meeting_url = values.meeting_url;
        if (values.notes) updateData.notes = values.notes;

        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Randevu güncellenirken hata oluştu');
        }

        toast.success('Randevu başarıyla güncellendi');
      } else {
        // Create mode - POST to create new appointment
        // Generate a unique booking ID for manual appointments
        const calcom_booking_id = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: values.lead_id,
            scheduled_at: scheduledAtISO,
            duration: parseInt(values.duration, 10),
            location: values.location || undefined,
            meeting_url: values.meeting_url || undefined,
            notes: values.notes || undefined,
            calcom_booking_id,
            status: AppointmentStatus.SCHEDULED,
            source: AppointmentSource.MANUAL,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Randevu oluşturulurken hata oluştu');
        }

        toast.success('Randevu başarıyla oluşturuldu');
      }

      onSave();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date for datetime input (current time in local format)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Lead Selection - hidden if pre-selected */}
        {!preSelectedLeadId && (
          <FormField
            control={form.control}
            name="lead_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri Adayı *</FormLabel>
                <FormControl>
                  {leadsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yükleniyor...
                    </div>
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!appointment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri adayı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Hiç müşteri adayı bulunamadı
                          </div>
                        ) : (
                          leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name}
                              {lead.company && ` (${lead.company})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Show pre-selected lead name if applicable */}
        {preSelectedLeadName && (
          <div className="space-y-2">
            <Label>Müşteri Adayı</Label>
            <div className="text-sm font-medium">{preSelectedLeadName}</div>
          </div>
        )}

        {/* Date and Time */}
        <FormField
          control={form.control}
          name="scheduled_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarih ve Saat *</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  min={minDateTime}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Süre (dakika) *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konum</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ofis, online, vb."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Meeting URL */}
        <FormField
          control={form.control}
          name="meeting_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Toplantı Linki</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Randevu notları..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {appointment ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
