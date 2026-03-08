'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserMinus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CampaignEnrollment } from '@/types/campaign';
import { EnrollmentStatus } from '@/types/campaign';

interface EnrollmentListProps {
  enrollments: CampaignEnrollment[];
  onRefresh?: () => void;
}

/**
 * Table displaying campaign enrollments with actions
 */
export function EnrollmentList({ enrollments, onRefresh }: EnrollmentListProps) {
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const handleUnsubscribe = async (enrollmentId: string) => {
    if (!confirm('Bu kaydı iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setUnsubscribing(enrollmentId);
      const response = await fetch(`/api/campaign-enrollments/${enrollmentId}/unsubscribe`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to unsubscribe');

      toast({
        title: 'Başarılı',
        description: 'Kayıt iptal edildi',
      });

      onRefresh?.();
    } catch (error) {
      console.error('[EnrollmentList] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'İptal işlemi başarısız',
      });
    } finally {
      setUnsubscribing(null);
    }
  };

  const getStatusVariant = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.Active:
        return 'default';
      case EnrollmentStatus.Completed:
        return 'outline';
      case EnrollmentStatus.Failed:
        return 'destructive';
      case EnrollmentStatus.Unsubscribed:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.Active:
        return 'Aktif';
      case EnrollmentStatus.Completed:
        return 'Tamamlandı';
      case EnrollmentStatus.Failed:
        return 'Başarısız';
      case EnrollmentStatus.Unsubscribed:
        return 'İptal';
      default:
        return status;
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu kampanyaya kayıtlı lead bulunmuyor
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtre:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
              <SelectItem value="unsubscribed">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Kampanya</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Adım</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEnrollments.map((enrollment) => {
            const lead = enrollment.expand?.lead_id;
            const campaign = enrollment.expand?.campaign_id;

            return (
              <TableRow key={enrollment.id}>
                <TableCell className="font-medium">
                  {lead?.name || enrollment.lead_id}
                </TableCell>
                <TableCell>{campaign?.name || enrollment.campaign_id}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(enrollment.status)}>
                    {getStatusLabel(enrollment.status)}
                  </Badge>
                </TableCell>
                <TableCell>{enrollment.current_step}</TableCell>
                <TableCell>
                  {enrollment.enrolled_at
                    ? new Date(enrollment.enrolled_at).toLocaleDateString('tr-TR')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {enrollment.status === EnrollmentStatus.Active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe(enrollment.id)}
                      disabled={unsubscribing === enrollment.id}
                    >
                      {unsubscribing === enrollment.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4 mr-2" />
                      )}
                      İptal
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {filteredEnrollments.length === 0 && enrollments.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Seçilen filtreye uygun kayıt bulunmuyor
        </div>
      )}
    </div>
  );
}
