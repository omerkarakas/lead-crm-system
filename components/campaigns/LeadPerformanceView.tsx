'use client';

import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  getLeadPerformance,
  type LeadPerformance,
  type DateRange
} from '@/lib/api/campaign-analytics';

interface LeadPerformanceViewProps {
  campaignId: string;
  dateRange: DateRange;
  pb: PocketBase;
}

export default function LeadPerformanceView({ campaignId, dateRange, pb }: LeadPerformanceViewProps) {
  const [leads, setLeads] = useState<LeadPerformance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const perPage = 20;

  useEffect(() => {
    loadLeads();
  }, [campaignId, dateRange, page, statusFilter]);

  async function loadLeads() {
    try {
      setLoading(true);
      const result = await getLeadPerformance(
        pb,
        campaignId,
        dateRange,
        page,
        perPage,
        search,
        statusFilter
      );

      setLeads(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setPage(1);
    loadLeads();
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      active: 'default',
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary'
    };

    const labels: Record<string, string> = {
      active: 'Aktif',
      completed: 'Tamamlandı',
      failed: 'Başarısız',
      pending: 'Bekliyor'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  }

  function getCompletionPercentage(lead: LeadPerformance): number {
    if (lead.total_steps === 0) return 0;
    return Math.round((lead.steps_completed / lead.total_steps) * 100);
  }

  function isStuck(lead: LeadPerformance): boolean {
    if (lead.status !== 'active') return false;
    const enrolledAt = new Date(lead.enrolled_at);
    const daysSinceEnrollment = Math.floor((Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceEnrollment > 7 && lead.steps_completed < lead.total_steps;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <CardTitle>Lider Performansı</CardTitle>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim veya e-posta ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button onClick={handleSearch} size="icon">
              <Search className="h-4 w-4" />
            </Button>

            {/* Refresh Button */}
            <Button onClick={loadLeads} size="icon" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search || statusFilter ? 'Filtre kriterlerine uygun lider bulunamadı' : 'Henüz kayıtlı lider yok'}
          </div>
        ) : (
          <>
            {/* Leads Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lider</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İlerleme</TableHead>
                    <TableHead>Adım</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const completionPercent = getCompletionPercentage(lead);
                    const stuck = isStuck(lead);

                    return (
                      <TableRow key={lead.lead_id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{lead.lead_name}</span>
                            {stuck && (
                              <span className="text-xs text-orange-600">
                                Takıldı (7+ gün)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(lead.enrolled_at)}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                              <div
                                className={`h-2 rounded-full ${
                                  completionPercent >= 100 ? 'bg-green-500' :
                                  completionPercent >= 50 ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(completionPercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {lead.steps_completed}/{lead.total_steps}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.current_step + 1}/{lead.total_steps}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                          >
                            <Link href={`/leads/${lead.lead_id}`}>
                              Detay
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Toplam {total} lider • Sayfa {page}/{totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
