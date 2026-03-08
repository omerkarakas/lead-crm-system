'use client';

import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Calendar } from 'lucide-react';
import CampaignMetrics from '@/components/campaigns/CampaignMetrics';
import EnrollmentPerformance from '@/components/campaigns/EnrollmentPerformance';
import LeadPerformanceView from '@/components/campaigns/LeadPerformanceView';
import type { DateRange } from '@/lib/api/campaign-analytics';

interface PerformanceDashboardProps {
  campaignId: string;
  campaignName: string;
  pb: PocketBase;
}

type DateRangeOption = '7d' | '30d' | '90d' | 'all';

const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: '7d', label: '7 Gün' },
  { value: '30d', label: '30 Gün' },
  { value: '90d', label: '90 Gün' },
  { value: 'all', label: 'Tüm Zamanlar' }
];

export default function PerformanceDashboard({ campaignId, campaignName, pb }: PerformanceDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastUpdated(new Date());
    }, 60000); // Auto-refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  function handleRefresh() {
    setRefreshKey(prev => prev + 1);
    setLastUpdated(new Date());
  }

  function handleDateRangeChange(range: DateRangeOption) {
    setDateRange(range);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{campaignName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kampanya Performans Raporu
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center border rounded-lg p-1">
            {dateRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleDateRangeChange(option.value)}
                className="h-7 px-3 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
          {autoRefreshEnabled && ' (Otomatik yenileme aktif)'}
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="leads">Liderler</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <CampaignMetrics
            key={`metrics-${refreshKey}`}
            campaignId={campaignId}
            dateRange={dateRange as DateRange}
            pb={pb}
          />

          <EnrollmentPerformance
            key={`enrollment-${refreshKey}`}
            campaignId={campaignId}
            dateRange={dateRange as DateRange}
            pb={pb}
          />
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <LeadPerformanceView
            key={`leads-${refreshKey}`}
            campaignId={campaignId}
            dateRange={dateRange as DateRange}
            pb={pb}
          />
        </TabsContent>
      </Tabs>

      {/* Auto-refresh toggle */}
      <div className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          id="auto-refresh"
          checked={autoRefreshEnabled}
          onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="auto-refresh" className="text-muted-foreground">
          Otomatik yenileme (60 saniye)
        </label>
      </div>
    </div>
  );
}
