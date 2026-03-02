'use client';

import { Lead, LeadStatus } from '@/types/lead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Hakem',
  [LeadStatus.BOOKED]: 'Randevu',
  [LeadStatus.CUSTOMER]: 'Müşteri',
  [LeadStatus.LOST]: 'Kayıp',
};

const STATUS_VARIANTS: Record<LeadStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [LeadStatus.NEW]: 'default',
  [LeadStatus.QUALIFIED]: 'secondary',
  [LeadStatus.BOOKED]: 'outline',
  [LeadStatus.CUSTOMER]: 'default',
  [LeadStatus.LOST]: 'destructive',
};

const SOURCE_LABELS: Record<string, string> = {
  web_form: 'Web Formu',
  api: 'API',
  manual: 'Manuel',
  whatsapp: 'WhatsApp',
};

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{lead.name}</h3>
              {lead.company && (
                <p className="text-sm text-muted-foreground">{lead.company}</p>
              )}
            </div>
            <Badge variant={STATUS_VARIANTS[lead.status]} className="font-medium">
              {STATUS_LABELS[lead.status]}
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Telefon:</span>
              <span className="font-medium">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">E-posta:</span>
                <span className="font-medium">{lead.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Kaynak:</span>
              <span>{SOURCE_LABELS[lead.source] || lead.source}</span>
            </div>
          </div>

          {lead.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Kayıt: {new Date(lead.created).toLocaleDateString('tr-TR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
