'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { SequenceScheduler } from '@/components/campaigns/SequenceScheduler';
import { ExecutionLog } from '@/components/campaigns/ExecutionLog';
import { toast } from 'sonner';
import type { Campaign, CampaignEnrollment, Sequence, EnrollmentStatus } from '@/types/campaign';

interface ExecutionPageClientProps {
  campaign: Campaign;
  sequences: Sequence[];
  enrollments: CampaignEnrollment[];
  stats: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  initialStatus?: string;
  initialSearch?: string;
}

export function ExecutionPageClient({
  campaign,
  sequences,
  enrollments: allEnrollments,
  stats,
  initialStatus,
  initialSearch
}: ExecutionPageClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);

  // Get the first active sequence for the scheduler
  const activeSequence = sequences.find(s => s.is_active) || sequences[0];

  // Filter enrollments
  const filteredEnrollments = allEnrollments.filter(enrollment => {
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;

    const lead = (enrollment.expand as any)?.lead_id;
    const matchesSearch = !searchQuery ||
      lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead?.phone?.includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    router.push(`/campaigns/${campaign.id}/execution?status=${value}&search=${searchQuery}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    router.push(`/campaigns/${campaign.id}/execution?status=${statusFilter}&search=${value}`);
  };

  const handleRetryEnrollment = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pb_auth') || ''}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tekrar başarılı', {
          description: 'Kayıt sıraya alındı'
        });
        router.refresh();
      } else {
        toast.error('Tekrar başarısız', {
          description: data.message || 'Bilinmeyen hata'
        });
      }
    } catch (error) {
      console.error('[ExecutionPageClient] Error retrying enrollment:', error);
      toast.error('Tekrar başarısız', {
        description: 'Sunucu hatası'
      });
    }
  };

  const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Aktif
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Tamamlandı
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Başarısız
          </Badge>
        );
      case 'unsubscribed':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Abonelikten Çıktı
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/campaigns" className="hover:text-foreground">
          Kampanyalar
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/campaigns/${campaign.id}`} className="hover:text-foreground">
          {campaign.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Yürütme İzleme</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yürütme İzleme</h1>
          <p className="text-muted-foreground mt-1">
            {campaign.name} - Dizi yürütme durumunu izleyin ve yönetin
          </p>
        </div>
        <Link href="/campaigns">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Aktif</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Tamamlandı</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Başarısız</div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Scheduler */}
      {activeSequence && (
        <SequenceScheduler
          sequenceId={activeSequence.id}
          campaignId={campaign.id}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lead adı, e-posta veya telefon..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="failed">Başarısız</SelectItem>
                  <SelectItem value="unsubscribed">Abonelikten Çıktı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment List */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">
            Kayıtlar ({filteredEnrollments.length})
          </h3>

          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Filtre kriterlerine uygun kayıt bulunamadı'
                : 'Henüz kayıt yok'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment) => {
                const lead = (enrollment.expand as any)?.lead_id;
                const sequence = (enrollment.expand as any)?.sequence_id;
                const isExpanded = expandedEnrollmentId === enrollment.id;

                return (
                  <div key={enrollment.id} className="border rounded-lg overflow-hidden">
                    {/* Enrollment Header */}
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setExpandedEnrollmentId(isExpanded ? null : enrollment.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="font-medium">
                            {lead?.name || 'Bilinmeyen Lead'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {lead?.email || lead?.phone || 'İletişim bilgisi yok'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Adım: </span>
                            <span className="font-medium">{enrollment.current_step}</span>
                          </div>

                          {getStatusBadge(enrollment.status)}

                          {enrollment.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryEnrollment(enrollment.id);
                              }}
                            >
                              Tekrar Dene
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 border-t">
                        <div className="space-y-4">
                          {/* Enrollment Details */}
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Kayıt Tarihi: </span>
                              <span className="font-medium">
                                {new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sıra: </span>
                              <span className="font-medium">{sequence?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sonraki Adım: </span>
                              <span className="font-medium">
                                {enrollment.next_step_scheduled
                                  ? new Date(enrollment.next_step_scheduled).toLocaleString('tr-TR')
                                  : 'Planlanmadı'}
                              </span>
                            </div>
                          </div>

                          {/* Execution Log */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Yürütme Günlüğü</h4>
                            <ExecutionLog enrollmentId={enrollment.id} autoRefresh={true} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
