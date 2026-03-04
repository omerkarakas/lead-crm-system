'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, Shield } from 'lucide-react';
import type { EmailMessage, EmailStatus } from '@/types/email';

interface EmailContentModalProps {
  email: EmailMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadgeVariant(status: EmailStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'sent':
      return 'default';
    case 'delivered':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
}

function getStatusLabel(status: EmailStatus): string {
  switch (status) {
    case 'sent':
      return 'Gönderildi';
    case 'delivered':
      return 'Teslim Edildi';
    case 'failed':
      return 'Başarısız';
    case 'pending':
      return 'Bekliyor';
    default:
      return status;
  }
}

function getStatusColor(status: EmailStatus): string {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return '';
  }
}

export function EmailContentModal({ email, open, onOpenChange }: EmailContentModalProps) {
  if (!email) return null;

  const statusColor = getStatusColor(email.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {email.subject}
          </DialogTitle>
          <DialogDescription>
            {email.sent_at && new Date(email.sent_at).toLocaleString('tr-TR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata Section */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kime:</span>
              </div>
              <span className="text-sm">{email.to_email}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tarih:</span>
              </div>
              <span className="text-sm">
                {email.sent_at ? new Date(email.sent_at).toLocaleString('tr-TR') : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Durum:</span>
              </div>
              <Badge className={statusColor} variant={getStatusBadgeVariant(email.status)}>
                {getStatusLabel(email.status)}
              </Badge>
            </div>
          </div>

          {/* Email Body Section */}
          <div className="border rounded-lg p-4 bg-white">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
