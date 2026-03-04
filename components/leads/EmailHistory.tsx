'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Inbox } from 'lucide-react';
import { getEmailHistory } from '@/lib/api/email';
import { EmailContentModal } from './EmailContentModal';
import type { EmailMessage, EmailStatus } from '@/types/email';
import { toast } from 'sonner';

interface EmailHistoryProps {
  leadId: string;
  onRefresh?: () => void;
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
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'delivered':
      return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    default:
      return '';
  }
}

export function EmailHistory({ leadId, onRefresh }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await getEmailHistory(leadId);
      setEmails(history);
    } catch (err: any) {
      setError(err.message || 'E-posta geçmişi yüklenirken hata oluştu');
      toast.error('E-posta geçmişi yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [leadId]);

  // Listen for refresh events
  useEffect(() => {
    if (onRefresh) {
      // We'll call loadEmails when parent signals refresh
      const handleRefresh = () => {
        loadEmails();
      };
      // This is a simple approach - in production you might use an event emitter
      window.addEventListener('email-sent', handleRefresh);
      return () => window.removeEventListener('email-sent', handleRefresh);
    }
  }, [leadId, onRefresh]);

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedEmail(email);
    setIsContentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsContentModalOpen(false);
    setSelectedEmail(null);
  };

  // Dispatch custom event when email is sent (for auto-refresh)
  const dispatchEmailSentEvent = () => {
    window.dispatchEvent(new CustomEvent('email-sent'));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="border">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">E-posta Geçmişi</h3>
          </div>
          {emails.length > 0 && (
            <Badge variant="secondary">{emails.length}</Badge>
          )}
        </div>

        {/* Email List or Empty State */}
        <div className="divide-y">
          {emails.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Henüz e-posta gönderilmedi</p>
            </div>
          ) : (
            emails.map((email) => {
              const statusColor = getStatusColor(email.status);

              return (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Date */}
                    <div className="text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
                      {email.sent_at
                        ? new Date(email.sent_at).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </div>

                    {/* Subject */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {email.subject || '(Konu yok)'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <Badge className={statusColor} variant={getStatusBadgeVariant(email.status)}>
                      {getStatusLabel(email.status)}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Email Content Modal */}
      <EmailContentModal
        email={selectedEmail}
        open={isContentModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          } else {
            setIsContentModalOpen(true);
          }
        }}
      />
    </>
  );
}
