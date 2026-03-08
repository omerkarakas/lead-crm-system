'use client';

import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadEnrollmentTimelineProps {
  enrollmentId: string;
  pb: PocketBase;
}

type ViewMode = 'timeline' | 'list';

interface SequenceMessage {
  id: string;
  step_order: number;
  step_name: string;
  step_type: 'email' | 'whatsapp' | 'delay';
  template_name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created: string;
  error_message?: string;
}

export default function LeadEnrollmentTimeline({ enrollmentId, pb }: LeadEnrollmentTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [messages, setMessages] = useState<SequenceMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [enrollmentId]);

  async function loadMessages() {
    try {
      setLoading(true);
      const result = await pb.collection('sequence_messages').getList(1, 50, {
        filter: `enrollment = "${enrollmentId}"`,
        sort: 'step_order'
      });

      setMessages(result.items as unknown as SequenceMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'read':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      pending: 'secondary',
      sent: 'default',
      delivered: 'default',
      read: 'default',
      failed: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      sent: 'Gönderildi',
      delivered: 'Teslim Edildi',
      read: 'Okundu',
      failed: 'Başarısız'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  }

  function getStepIcon(type: string) {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5" />;
      case 'delay':
        return <Clock className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kayıt Zaman Çizelgesi</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Zaman Çizelgesi
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Liste
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Henüz mesaj gönderilmedi
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline items */}
            <div className="space-y-6">
              {messages.map((message, index) => {
                const isPending = message.status === 'pending';
                const isFailed = message.status === 'failed';

                return (
                  <div key={message.id} className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isPending ? 'bg-gray-100' :
                      isFailed ? 'bg-red-50' :
                      'bg-green-50'
                    }`}>
                      {getStepIcon(message.step_type)}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 p-4 rounded-lg ${
                      isPending ? 'bg-gray-50 opacity-60' :
                      isFailed ? 'bg-red-50' :
                      'bg-white border'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {message.step_name || `Adım ${message.step_order + 1}`}
                            </span>
                            {getStatusBadge(message.status)}
                          </div>

                          {message.template_name && (
                            <div className="text-sm text-muted-foreground mb-2">
                              Şablon: {message.template_name}
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground">
                            {formatDate(message.created)}
                          </div>

                          {message.error_message && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                              {message.error_message}
                            </div>
                          )}
                        </div>

                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List view */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adım</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Şablon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Gönderim Tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">
                    {message.step_name || `Adım ${message.step_order + 1}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStepIcon(message.step_type)}
                      <span className="capitalize">
                        {message.step_type === 'email' ? 'E-posta' :
                         message.step_type === 'whatsapp' ? 'WhatsApp' :
                         'Gecikme'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.template_name || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(message.status)}
                  </TableCell>
                  <TableCell>
                    {formatDate(message.created)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
