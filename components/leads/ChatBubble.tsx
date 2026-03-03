'use client';

import { WhatsAppMessage } from '@/types/qa';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: WhatsAppMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isIncoming = message.direction === 'incoming';
  const sentAt = message.sent_at ? new Date(message.sent_at) : null;

  // Format timestamp in Turkish locale
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get message type icon/label
  const getMessageTypeLabel = () => {
    switch (message.message_type) {
      case 'poll':
        return 'Anket';
      case 'booking_link':
        return 'Randevu Linki';
      case 'info':
        return 'Bilgi';
      case 'error':
        return 'Hata';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      'flex w-full mb-4',
      isIncoming ? 'justify-start' : 'justify-end'
    )}>
      <div className={cn(
        'flex flex-col max-w-[75%]',
        isIncoming ? 'items-start' : 'items-end'
      )}>
        {/* Message bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-2 shadow-sm',
          isIncoming
            ? 'bg-gray-100 text-gray-900 rounded-tl-none'
            : 'bg-green-500 text-white rounded-tr-none'
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message_text}
          </p>

          {/* Message type label */}
          {getMessageTypeLabel() && (
            <span className={cn(
              'text-xs mt-1 inline-block px-2 py-0.5 rounded',
              isIncoming
                ? 'bg-gray-200 text-gray-600'
                : 'bg-green-600 text-green-100'
            )}>
              {getMessageTypeLabel()}
            </span>
          )}
        </div>

        {/* Status and timestamp row */}
        <div className={cn(
          'flex items-center gap-1 mt-1 px-1',
          isIncoming ? 'justify-start' : 'justify-end'
        )}>
          {/* Status badge for outgoing messages */}
          {!isIncoming && message.status !== 'received' && (
            <MessageStatusBadge status={message.status} />
          )}

          {/* Timestamp */}
          {sentAt && (
            <span className="text-xs text-gray-500">
              {formatTimestamp(sentAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageStatusBadgeProps {
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const statusConfig = {
    sent: { icon: Check, label: 'Gönderildi', className: 'text-gray-400' },
    delivered: { icon: Check, label: 'İletildi', className: 'text-gray-400' },
    read: { icon: CheckCheck, label: 'Okundu', className: 'text-blue-500' },
    failed: { icon: AlertCircle, label: 'Başarısız', className: 'text-red-500' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1', config.className)} title={config.label}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
