'use client';

import { useState, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, CheckCircle, XCircle, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignEnrollment } from '@/types/campaign';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

interface SequenceSchedulerProps {
  sequenceId: string;
  campaignId: string;
}

interface SchedulerStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
}

interface RecentActivity {
  id: string;
  enrollment_id: string;
  status: string;
  updated: string;
  lead?: {
    name: string;
  };
}

export function SequenceScheduler({ sequenceId, campaignId }: SequenceSchedulerProps) {
  const [stats, setStats] = useState<SchedulerStats>({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchStats = async () => {
    try {
      const pb = new PocketBase(PB_URL);

      // Get auth from cookie
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
        if (pbCookie) {
          pb.authStore.loadFromCookie(pbCookie.trim());
        }
      }

      // Fetch all enrollments for this sequence
      const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
        1,
        100,
        {
          filter: `sequence_id = "${sequenceId}"`,
          sort: '-updated',
          expand: 'lead_id'
        }
      );

      // Calculate stats
      const total = response.totalItems;
      const active = response.items.filter(e => e.status === 'active').length;
      const completed = response.items.filter(e => e.status === 'completed').length;
      const failed = response.items.filter(e => e.status === 'failed').length;

      setStats({ total, active, completed, failed });

      // Get recent activity (last 10)
      const recent: RecentActivity[] = response.items.slice(0, 10).map(item => ({
        id: item.id,
        enrollment_id: item.id,
        status: item.status,
        updated: item.updated,
        lead: (item.expand as any)?.lead_id
      }));

      setRecentActivity(recent);
      setLoading(false);
    } catch (error) {
      console.error('[SequenceScheduler] Error fetching stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [sequenceId]);

  const handleProcessNow = async () => {
    setProcessing(true);

    try {
      const response = await fetch('/api/cron/process-sequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.CRON_SECRET && {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          })
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.processed} kayıt işlendi`, {
          description: `${data.successes} başarılı, ${data.failures} başarısız`
        });

        // Refresh stats
        await fetchStats();
      } else {
        toast.error('İşlem başarısız', {
          description: data.message || 'Bilinmeyen hata'
        });
      }
    } catch (error) {
      console.error('[SequenceScheduler] Error processing:', error);
      toast.error('İşlem başarısız', {
        description: 'Sunucu hatası'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dakika önce`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} saat önce`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} gün önce`;
    } catch {
      return timestamp;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Tamamlandı
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Başarısız
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sıra Zamanlayıcısı</CardTitle>
            <CardDescription>Otomatik dizi işleme ve izleme</CardDescription>
          </div>
          <Button
            onClick={handleProcessNow}
            disabled={processing}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Şimdi İşle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Aktif</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Tamamlandı</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Başarısız</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListTodo className="h-4 w-4" />
            <h3 className="text-sm font-medium">Son Aktivite</h3>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Henüz aktivite yok
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {activity.lead?.name || 'Bilinmeyen Lead'}
                    </span>
                    {getStatusBadge(activity.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.updated)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Import Skeleton component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className || ''}`}
      {...props}
    />
  );
}
