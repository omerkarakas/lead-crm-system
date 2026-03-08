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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserMinus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CampaignEnrollment } from '@/types/campaign';
import { EnrollmentStatus } from '@/types/campaign';
import { EnrollDialog } from './EnrollDialog';

interface LeadEnrollmentsProps {
  leadId: string;
}

/**
 * Display lead's campaign enrollments with actions
 */
export function LeadEnrollments({ leadId }: LeadEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<CampaignEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaign-enrollments?lead_id=${leadId}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');

      const data = await response.json();
      setEnrollments(data.items || []);
    } catch (error) {
      console.error('[LeadEnrollments] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Kampanya kayıtları alınamadı',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (enrollmentId: string) => {
    if (!confirm('Bu kampanyadan ayrılmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(`/api/campaign-enrollments/${enrollmentId}/unsubscribe`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to unsubscribe');

      toast({
        title: 'Başarılı',
        description: 'Kampanyadan ayrıldınız',
      });

      // Refresh enrollments
      await fetchEnrollments();
    } catch (error) {
      console.error('[LeadEnrollments] Unsubscribe error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Kampanyadan ayrılırken hata oluştu',
      });
    } finally {
      setEnrolling(false);
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
        return 'Ayrıldı';
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchEnrollments();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEnrollments, 30000);
    return () => clearInterval(interval);
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kampanyalar</CardTitle>
          <CardDescription>Bu lead henüz hiçbir kampanyaya kayıtlı değil</CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollDialog leadId={leadId} onEnroll={fetchEnrollments} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kampanyalar</CardTitle>
            <CardDescription>{enrollments.length} aktif kampanya kaydı</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEnrollments}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <EnrollDialog leadId={leadId} onEnroll={fetchEnrollments} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kampanya</TableHead>
              <TableHead>Dizi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Adım</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              const campaign = enrollment.expand?.campaign_id;
              const sequence = enrollment.expand?.sequence_id;

              return (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {campaign?.name || enrollment.campaign_id}
                  </TableCell>
                  <TableCell>{sequence?.name || enrollment.sequence_id}</TableCell>
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
                        disabled={enrolling}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Ayrıl
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
