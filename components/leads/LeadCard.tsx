'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lead, LeadStatus } from '@/types/lead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Pencil, Phone, Mail, Loader2 } from 'lucide-react';
import { LeadQualityBadge } from './LeadQualityBadge';
import { calculateQualityStatus } from '@/lib/utils/lead-scoring';
import { cn } from '@/lib/utils';

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

const SOURCE_LABELS: Record<string, string> = {
  web_form: 'Web Formu',
  api: 'API',
  manual: 'Manuel',
  whatsapp: 'WhatsApp',
};

interface LeadCardProps {
  lead: Lead;
  onEdit?: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleEmail = () => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 relative overflow-hidden',
      isNavigating && 'pointer-events-none',
      isNavigating && 'opacity-70 dark:opacity-80'
    )}>
      {/* Loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] dark:bg-black/50 flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary dark:text-white" />
        </div>
      )}
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <Link
              href={`/leads/${lead.id}`}
              className="flex-1 hover:text-primary transition-colors"
              onClick={() => setIsNavigating(true)}
            >
              <h3 className="font-semibold text-lg">{lead.name}</h3>
              {lead.company && (
                <p className="text-sm text-muted-foreground">{lead.company}</p>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[lead.status]} className="font-medium">
                {STATUS_LABELS[lead.status]}
              </Badge>
              <LeadQualityBadge
                quality={calculateQualityStatus(lead.total_score || lead.score || 0, lead.qa_completed)}
                score={lead.total_score || lead.score || 0}
                size="sm"
                showIcon={false}
              />
              <TooltipProvider>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        disabled={isNavigating}
                      >
                        <Link href={`/leads/${lead.id}`} onClick={() => setIsNavigating(true)}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Detay</TooltipContent>
                  </Tooltip>
                  {onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onEdit(lead)}
                          disabled={isNavigating}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Düzenle</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </div>

          <div className={cn('space-y-1 text-sm', isNavigating && 'opacity-50')}>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16">Telefon:</span>
              <span className="font-medium">{lead.phone}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
                onClick={handleCall}
                disabled={isNavigating}
              >
                <Phone className="h-3 w-3" />
              </Button>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16">E-posta:</span>
                <span className="font-medium">{lead.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={handleEmail}
                  disabled={isNavigating}
                >
                  <Mail className="h-3 w-3" />
                </Button>
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
