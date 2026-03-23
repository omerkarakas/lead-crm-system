'use client';

import { Lead, LeadStatus, LeadSource } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Globe, Building2, MessageSquare } from 'lucide-react';

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Uygun',
  [LeadStatus.BOOKED]: 'Randevu',
  [LeadStatus.CUSTOMER]: 'Müşteri',
  [LeadStatus.LOST]: 'Kayıp',
  [LeadStatus.RE_APPLY]: 'Tekrar Başvuru',
};

const STATUS_VARIANTS: Record<LeadStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [LeadStatus.NEW]: 'default',
  [LeadStatus.QUALIFIED]: 'secondary',
  [LeadStatus.BOOKED]: 'outline',
  [LeadStatus.CUSTOMER]: 'default',
  [LeadStatus.LOST]: 'destructive',
  [LeadStatus.RE_APPLY]: 'secondary',
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.WEB_FORM]: 'Web Formu',
  [LeadSource.API]: 'API',
  [LeadSource.MANUAL]: 'Manuel',
  [LeadSource.WHATSAPP]: 'WhatsApp',
};

interface LeadInfoProps {
  lead: Lead;
}

export function LeadInfo({ lead }: LeadInfoProps) {
  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    // Eğer protokol yoksa ekle
    if (!url.match(/^https?:\/\//i)) {
      return `https://${url}`;
    }
    return url;
  };

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    const phone = lead.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Müşteri Adayı Bilgileri</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[lead.status]} className="font-medium">
              {STATUS_LABELS[lead.status]}
            </Badge>
            {lead.offer_response && lead.offer_responded_at && (
              <Badge variant="outline" className="text-xs">
                {lead.offer_response === 'kabul' ? 'Teklif Kabul' : 'Teklif Red'}
              </Badge>
            )}
          </div>
        </div>
        {/* Auto-update reason for status */}
        {(lead.status === LeadStatus.CUSTOMER || lead.status === LeadStatus.LOST) &&
         lead.offer_response && (
          <p className="text-xs text-muted-foreground mt-2">
            {lead.offer_response === 'kabul' ? '(Teklif kabul edildi)' : '(Teklif reddedildi)'}
            {lead.offer_responded_at && ` • ${new Date(lead.offer_responded_at).toLocaleDateString('tr-TR')}`}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ad Soyad</label>
              <p className="text-lg font-semibold">{lead.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Durum</label>
              <p>{STATUS_LABELS[lead.status]}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefon</label>
              <div className="flex items-center gap-2">
                <a href={`tel:${lead.phone}`} className="font-medium hover:text-blue-600">
                  {lead.phone}
                </a>
                <div className="flex gap-1">
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Ara"
                  >
                    <Phone className="h-3 w-3" />
                  </a>
                  <button
                    onClick={handleWhatsApp}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            {lead.email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-posta</label>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {lead.email}
                  </a>
                  <a
                    href={`mailto:${lead.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="E-posta Gönder"
                  >
                    <Mail className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {lead.company && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Şirket</label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{lead.company}</p>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {lead.website && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Website</label>
              <div className="flex items-center gap-2">
                <a
                  href={formatWebsiteUrl(lead.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {lead.website}
                </a>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Source and Metadata */}
        <div className="border-t pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">Kaynak</label>
              <p>{SOURCE_LABELS[lead.source] || lead.source}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Kayıt Tarihi</label>
              <p>{new Date(lead.created).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {lead.message && (
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground">Mesaj</label>
            <p className="mt-1 text-sm whitespace-pre-wrap">{lead.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
