'use client';

import { Lead, LeadStatus } from '@/types/lead';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Loader2, Eye, Pencil } from 'lucide-react';
import { LeadCard } from './LeadCard';

interface LeadListProps {
  leads: Lead[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onEditLead?: (lead: Lead) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Aday',
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

const getSortIndicator = (field: string, sortField?: string, sortOrder?: 'asc' | 'desc') => {
  if (sortField !== field) return '';
  return sortOrder === 'asc' ? ' ↑' : ' ↓';
};

export function LeadList({
  leads,
  loading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  onEditLead,
}: LeadListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-2">Lead bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            Farklı arama kriterleri deneyin veya filtreleri temizleyin
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Toplam {totalItems} lead
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Önceki
        </Button>
        <span className="text-sm">
          Sayfa {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sonraki
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('name')}
              >
                Ad Soyad{getSortIndicator('name', sortField, sortOrder)}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('phone')}
              >
                Telefon{getSortIndicator('phone', sortField, sortOrder)}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('email')}
              >
                E-posta{getSortIndicator('email', sortField, sortOrder)}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('company')}
              >
                Şirket{getSortIndicator('company', sortField, sortOrder)}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('status')}
              >
                Durum{getSortIndicator('status', sortField, sortOrder)}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('source')}
              >
                Kaynak{getSortIndicator('source', sortField, sortOrder)}
              </TableHead>
              <TableHead>Etiketler</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('created')}
              >
                Kayıt Tarihi{getSortIndicator('created', sortField, sortOrder)}
              </TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.email || '-'}</TableCell>
                <TableCell>{lead.company || '-'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[lead.status]} className="font-medium">
                    {STATUS_LABELS[lead.status]}
                  </Badge>
                </TableCell>
                <TableCell>{SOURCE_LABELS[lead.source] || lead.source}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags.length > 0 ? (
                      lead.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(lead.created).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => window.location.href = `/leads/${lead.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Detay</TooltipContent>
                      </Tooltip>
                      {onEditLead && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEditLead(lead)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Düzenle</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4">
          {renderPagination()}
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onEdit={onEditLead} />
        ))}
        <div className="flex justify-center">
          {renderPagination()}
        </div>
      </div>
    </>
  );
}
