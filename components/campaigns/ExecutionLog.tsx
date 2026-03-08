'use client';

import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { Mail, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SequenceMessage } from '@/types/campaign';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

interface ExecutionLogProps {
  enrollmentId: string;
  autoRefresh?: boolean;
}

export function ExecutionLog({ enrollmentId, autoRefresh = true }: ExecutionLogProps) {
  const [messages, setMessages] = useState<SequenceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const pb = new PocketBase(PB_URL);

      // Get auth from cookie
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
        if (pbCookie) {
          pb.authStore.loadFromCookie(pbCookie.trim());
        }
      }

      const response = await pb.collection('sequence_messages').getList<SequenceMessage>(
        1,
        50,
        {
          filter: `enrollment_id = "${enrollmentId}"`,
          sort: 'step_order'
        }
      );

      setMessages(response.items);
      setError(null);
    } catch (err: any) {
      console.error('[ExecutionLog] Error fetching messages:', err);
      setError(err.message || 'Failed to load execution log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (autoRefresh) {
      const interval = setInterval(fetchMessages, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [enrollmentId, autoRefresh]);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;

    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return timestamp;
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gönderildi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Başarısız
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            Bekliyor
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Henüz mesaj gönderilmedi
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div key={message.id} className="relative">
          {/* Vertical line connecting messages */}
          {index < messages.length - 1 && (
            <div className="absolute left-4 top-8 w-px h-full bg-border" />
          )}

          <div className="flex items-start gap-4">
            {/* Step type icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.status === 'sent'
                ? 'bg-green-100 text-green-600'
                : message.status === 'failed'
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {getStepIcon(message.step_type)}
            </div>

            {/* Message details */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  Adım {message.step_order + 1}
                </span>
                {getStatusBadge(message.status)}
              </div>

              {message.template_id && (
                <p className="text-sm text-muted-foreground mb-1">
                  Şablon: {message.template_id}
                </p>
              )}

              {message.sent_at && (
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(message.sent_at)}
                </p>
              )}

              {message.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {message.error_message}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
