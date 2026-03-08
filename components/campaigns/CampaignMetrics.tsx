'use client';

import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Clock, XCircle, Mail, MessageSquare, TrendingUp } from 'lucide-react';
import {
  getCampaignMetrics,
  getEnrollmentMetrics,
  getEmailEngagement,
  getWhatsAppDelivery,
  getTimeSeriesData,
  type DateRange
} from '@/lib/api/campaign-analytics';

interface CampaignMetricsProps {
  campaignId: string;
  dateRange: DateRange;
  pb: PocketBase;
}

const COLORS = {
  success: '#10b981',
  active: '#3b82f6',
  failed: '#ef4444',
  pending: '#f59e0b',
  email: '#8b5cf6',
  whatsapp: '#25d366'
};

export default function CampaignMetrics({ campaignId, dateRange, pb }: CampaignMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [enrollmentMetrics, setEnrollmentMetrics] = useState<any>(null);
  const [emailMetrics, setEmailMetrics] = useState<any>(null);
  const [whatsappMetrics, setWhatsappMetrics] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, [campaignId, dateRange]);

  async function loadMetrics() {
    try {
      setLoading(true);
      const [metricsData, enrollmentData, emailData, whatsappData, timeSeries] = await Promise.all([
        getCampaignMetrics(pb, campaignId, dateRange),
        getEnrollmentMetrics(pb, campaignId, dateRange),
        getEmailEngagement(pb, campaignId, dateRange),
        getWhatsAppDelivery(pb, campaignId, dateRange),
        getTimeSeriesData(pb, campaignId, dateRange, 'day')
      ]);

      setMetrics(metricsData);
      setEnrollmentMetrics(enrollmentData);
      setEmailMetrics(emailData);
      setWhatsappMetrics(whatsappData);
      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare status distribution data for pie chart
  const statusDistribution = [
    { name: 'Aktif', value: metrics.active_enrollments, color: COLORS.active },
    { name: 'Tamamlandı', value: metrics.completed_enrollments, color: COLORS.success },
    { name: 'Başarısız', value: metrics.failed_enrollments, color: COLORS.failed }
  ];

  // Prepare enrollment funnel data
  const funnelData = enrollmentMetrics?.step_completion_rates?.map((step: any) => ({
    name: step.step_name,
    value: step.count,
    rate: step.rate
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_enrollments}</div>
            <p className="text-xs text-muted-foreground">
              Kampanyaya kayıtlı lider
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlama Oranı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{enrollmentMetrics?.completion_rate || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completed_enrollments} tamamlanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kayıtlar</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_enrollments}</div>
            <p className="text-xs text-muted-foreground">
              Devam ediyor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failed_enrollments}</div>
            <p className="text-xs text-muted-foreground">
              %{enrollmentMetrics?.failure_rate || 0} hata oranı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Kayıt Hunisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.active} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Veri bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>Zaman Serisi</CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData?.labels && timeSeriesData.labels.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData.labels.map((label: string, i: number) => ({
                  date: label,
                  kayit: timeSeriesData.datasets[0].data[i]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="kayit" stroke={COLORS.active} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Veri bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.total_enrollments > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Veri bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Kanal Metrikleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span className="font-medium">E-posta</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {emailMetrics?.total_sent || 0} gönderildi
                </div>
                <div className="text-xs text-muted-foreground">
                  Açılma: %{emailMetrics?.open_rate || 0} |
                  Tıklama: %{emailMetrics?.click_rate || 0}
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="font-medium">WhatsApp</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {whatsappMetrics?.total_sent || 0} gönderildi
                </div>
                <div className="text-xs text-muted-foreground">
                  Teslimat: %{whatsappMetrics?.delivery_rate || 0} |
                  Okuma: %{whatsappMetrics?.read_rate || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
