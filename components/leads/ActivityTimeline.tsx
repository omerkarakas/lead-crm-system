'use client';

import { useState, useEffect } from 'react';
import {
  ActivityEvent,
  ActivityType,
  TimelineFilters
} from '@/types/activity';
import { fetchActivityTimeline } from '@/lib/api/activity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Mail,
  FileText,
  Calendar,
  MessageSquare,
  BadgeCheck,
  FileEdit,
  UserPlus,
  Megaphone
} from 'lucide-react';

interface ActivityTimelineProps {
  leadId: string;
}

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TimelineFilters>({ types: [] });
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Type filter options
  const typeOptions = [
    { value: ActivityType.Note, label: 'Not', icon: FileText },
    { value: ActivityType.WhatsApp, label: 'WhatsApp', icon: MessageCircle },
    { value: ActivityType.Email, label: 'E-posta', icon: Mail },
    { value: ActivityType.Appointment, label: 'Randevu', icon: Calendar },
    { value: ActivityType.QAAnswer, label: 'QA', icon: MessageSquare },
    { value: ActivityType.ProposalSent, label: 'Teklif', icon: FileEdit },
    { value: ActivityType.ProposalResponse, label: 'Teklif Cevap', icon: FileEdit },
    { value: ActivityType.CampaignEnrolled, label: 'Kampanya', icon: Megaphone },
    { value: ActivityType.LeadCreated, label: 'Oluşturma', icon: UserPlus }
  ];

  useEffect(() => {
    loadEvents();
  }, [leadId, filters, page]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetchActivityTimeline(leadId, filters, page, 50);
      setEvents(page === 1 ? response.events : [...events, ...response.events]);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTypeFilter = (type: ActivityType) => {
    setFilters((prev) => {
      const newTypes = prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type];
      setPage(1); // Reset page when filters change
      return { ...prev, types: newTypes };
    });
  };

  const getEventIcon = (event: ActivityEvent) => {
    // Return appropriate icon based on event type
    switch (event.type) {
      case ActivityType.Note:
        return <FileText className="h-4 w-4 text-blue-600" />;
      case ActivityType.WhatsApp:
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case ActivityType.Email:
        return <Mail className="h-4 w-4 text-blue-500" />;
      case ActivityType.Appointment:
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case ActivityType.QAAnswer:
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case ActivityType.ProposalSent:
        return <FileEdit className="h-4 w-4 text-indigo-600" />;
      case ActivityType.ProposalResponse:
        return <BadgeCheck className="h-4 w-4 text-indigo-600" />;
      case ActivityType.CampaignEnrolled:
        return <Megaphone className="h-4 w-4 text-pink-600" />;
      case ActivityType.LeadCreated:
        return <UserPlus className="h-4 w-4 text-gray-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getEventTitle = (event: ActivityEvent) => {
    switch (event.type) {
      case ActivityType.Note:
        return 'Not eklendi';
      case ActivityType.WhatsApp:
        return (event as any).direction === 'incoming'
          ? 'WhatsApp mesajı alındı'
          : 'WhatsApp mesajı gönderildi';
      case ActivityType.Email:
        return 'E-posta gönderildi';
      case ActivityType.Appointment:
        const action = (event as any).action;
        if (action === 'created') return 'Randevu oluşturuldu';
        if (action === 'updated') return 'Randevu güncellendi';
        if (action === 'cancelled') return 'Randevu iptal edildi';
        if (action === 'completed') return 'Randevu tamamlandı';
        return 'Randevu';
      case ActivityType.QAAnswer:
        return 'QA cevabı verildi';
      case ActivityType.ProposalSent:
        return 'Teklif gönderildi';
      case ActivityType.ProposalResponse:
        const response = (event as any).response;
        if (response === 'KABUL') return 'Teklif kabul edildi';
        if (response === 'RED') return 'Teklif reddedildi';
        return 'Teklif cevabı bekleniyor';
      case ActivityType.CampaignEnrolled:
        return `Kampanyaya kayıt olundu: ${(event as any).campaignName}`;
      case ActivityType.LeadCreated:
        return 'Müşteri adayı oluşturuldu';
      default:
        return 'Etkinlik';
    }
  };

  const getEventContent = (event: ActivityEvent) => {
    if (expandedEvent !== event.id) {
      // Compact view
      return null;
    }

    // Expanded view based on type
    switch (event.type) {
      case ActivityType.Note:
        return <p className="text-sm text-gray-700">{(event as any).content}</p>;
      case ActivityType.WhatsApp:
        return <p className="text-sm text-gray-700">{(event as any).message}</p>;
      case ActivityType.Email:
        return (
          <div className="text-sm text-gray-700">
            <p className="font-medium">{(event as any).subject}</p>
          </div>
        );
      case ActivityType.Appointment:
        return (
          <div className="text-sm text-gray-700">
            <p>
              <span className="font-medium">Planlanan:</span>{' '}
              {new Date((event as any).scheduledAt).toLocaleString('tr-TR')}
            </p>
            <p>
              <span className="font-medium">Durum:</span> {(event as any).status}
            </p>
          </div>
        );
      case ActivityType.QAAnswer:
        return (
          <div className="text-sm text-gray-700">
            <p className="font-medium">{(event as any).question}</p>
            <p>
              Cevap: {(event as any).answer} ({(event as any).pointsEarned} puan)
            </p>
          </div>
        );
      case ActivityType.ProposalSent:
        return (
          <div className="text-sm text-gray-700">
            <p>Teklif belgesi gönderildi</p>
          </div>
        );
      case ActivityType.ProposalResponse:
        const response = (event as any).response;
        let responseText = 'Bekleniyor';
        if (response === 'KABUL') responseText = 'Kabul edildi';
        if (response === 'RED') responseText = 'Reddedildi';
        return (
          <div className="text-sm text-gray-700">
            <p>Teklif cevabı: {responseText}</p>
          </div>
        );
      case ActivityType.CampaignEnrolled:
        return (
          <div className="text-sm text-gray-700">
            <p>
              Kampanya: {(event as any).campaignName}
            </p>
            <p>
              {(event as any).sequenceCount} adımlık dizi
            </p>
          </div>
        );
      case ActivityType.LeadCreated:
        return (
          <div className="text-sm text-gray-700">
            <p>Müşteri adayı kaydı oluşturuldu</p>
          </div>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Henüz aktivite yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = filters.types.includes(option.value);
          return (
            <Button
              key={option.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleTypeFilter(option.value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Events */}
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center z-10">
                {getEventIcon(event)}
              </div>

              {/* Content */}
              <div
                className="flex-1 bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  setExpandedEvent(expandedEvent === event.id ? null : event.id)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getEventTitle(event)}</p>
                    {getEventContent(event)}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Daha Fazla'}
          </Button>
        </div>
      )}
    </div>
  );
}
