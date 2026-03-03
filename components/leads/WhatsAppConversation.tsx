'use client';

import { useState, useEffect } from 'react';
import { ChatBubble } from './ChatBubble';
import { getLeadWhatsAppMessages } from '@/lib/api/whatsapp';
import { WhatsAppMessage } from '@/types/qa';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppConversationProps {
  leadId: string;
}

export function WhatsAppConversation({ leadId }: WhatsAppConversationProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      const data = await getLeadWhatsAppMessages(leadId);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError('Mesajlar yüklenirken hata oluştu');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [leadId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [leadId]);

  const handleManualRefresh = () => {
    loadMessages(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center h-48">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">WhatsApp Mesajları</h2>
          {messages.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({messages.length} mesaj)
            </span>
          )}
        </div>

        <button
          onClick={handleManualRefresh}
          className={cn(
            'p-2 rounded-md hover:bg-gray-100 transition-colors',
            isRefreshing && 'animate-spin'
          )}
          title="Yenile"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p>Henüz WhatsApp mesajı yok</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
