'use client';

import { Campaign, CampaignType, CampaignWithSequences } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, MessageSquare, Pencil, Trash2, List } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CampaignListProps {
  campaigns: CampaignWithSequences[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onViewSequences: (campaign: Campaign) => void;
}

export function CampaignList({
  campaigns,
  onEdit,
  onDelete,
  onViewSequences,
}: CampaignListProps) {
  const getSegmentDescription = (campaign: Campaign) => {
    const rules = campaign.audience_segment?.rules || [];
    if (rules.length === 0) return '-';

    const operator = campaign.audience_segment?.operator === 'or' ? 'VEYA' : 'VE';
    const descriptions = rules.map(r => {
      const fieldLabels: Record<string, string> = {
        score: 'Skor',
        status: 'Durum',
        source: 'Kaynak',
        tags: 'Etiketler',
      };
      const operatorLabels: Record<string, string> = {
        eq: '=',
        ne: '≠',
        gt: '>',
        lt: '<',
        gte: '≥',
        lte: '≤',
        contains: 'içerir',
        not_contains: 'içermez',
      };
      return `${fieldLabels[r.field] || r.field} ${operatorLabels[r.operator] || r.operator} ${r.value}`;
    });

    return descriptions.join(` ${operator} `);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kampanya Adı</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead>Sıralar</TableHead>
            <TableHead>Min. Skor</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Henüz kampanya yok. İlk kampanyanızı oluşturun.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => {
              const sequenceCount = campaign.sequences?.length || 0;
              const firstSequenceName = campaign.sequences?.[0]?.name || null;

              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {campaign.type === CampaignType.Email ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-green-500" />
                      )}
                      <span className="capitalize">{campaign.type === CampaignType.Email ? 'E-posta' : 'WhatsApp'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getSegmentDescription(campaign)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {sequenceCount > 0 ? (
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">{sequenceCount} sıra</Badge>
                        {firstSequenceName && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {firstSequenceName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.auto_enroll_min_score ? (
                      <Badge variant="secondary">{campaign.auto_enroll_min_score}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                      {campaign.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <div className="flex justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onViewSequences(campaign)}>
                              <List className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sıraları Görüntüle</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEdit(campaign)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Düzenle</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(campaign)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sil</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
