'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';
import { AppointmentStatus, AppointmentSource } from '@/types/appointment';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedLeadId?: string;
  preSelectedLeadName?: string;
}

export function AppointmentModal({
  open,
  onOpenChange,
  preSelectedLeadId,
  preSelectedLeadName,
}: AppointmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lead_id: preSelectedLeadId || '',
    scheduled_at: '',
    duration: '60',
    location: '',
    meeting_url: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a unique booking ID for manual appointments
      const calcom_booking_id = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          calcom_booking_id,
          status: AppointmentStatus.SCHEDULED,
          source: AppointmentSource.MANUAL,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
      }

      onOpenChange(false);
      // Reset form
      setFormData({
        lead_id: preSelectedLeadId || '',
        scheduled_at: '',
        duration: '60',
        location: '',
        meeting_url: '',
        notes: '',
      });
      // Refresh the page to show new appointment
      router.refresh();
    } catch (error) {
      console.error('Error creating appointment:', error);
      // Could show error toast here
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
          <DialogDescription>
            {preSelectedLeadName
              ? `${preSelectedLeadName} için randevu oluşturun`
              : 'Müşteri adayı için randevu oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Selection - hidden if pre-selected */}
          {!preSelectedLeadId && (
            <div className="space-y-2">
              <Label htmlFor="lead_id">Müşteri Adayı *</Label>
              <Select
                value={formData.lead_id}
                onValueChange={(value) => handleInputChange('lead_id', value)}
                required
              >
                <SelectTrigger id="lead_id">
                  <SelectValue placeholder="Müşteri adayı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {/* Would need to fetch leads */}
                  <SelectItem value="">Seçin...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date and Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Tarih ve Saat *</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Süre (dakika)</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => handleInputChange('duration', value)}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dakika</SelectItem>
                <SelectItem value="60">60 dakika</SelectItem>
                <SelectItem value="90">90 dakika</SelectItem>
                <SelectItem value="120">120 dakika</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              type="text"
              placeholder="Ofis, online, vb."
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meeting_url">Toplantı Linki</Label>
            <Input
              id="meeting_url"
              type="url"
              placeholder="https://meet.google.com/..."
              value={formData.meeting_url}
              onChange={(e) => handleInputChange('meeting_url', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Randevu notları..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
