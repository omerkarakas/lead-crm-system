'use client';

import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, Clock } from 'lucide-react';
import {
  getEnrollmentMetrics,
  getConversionMetrics,
  type DateRange
} from '@/lib/api/campaign-analytics';

interface EnrollmentPerformanceProps {
  campaignId: string;
  dateRange: DateRange;
  pb: PocketBase;
}

export default function EnrollmentPerformance({ campaignId, dateRange, pb }: EnrollmentPerformanceProps) {
  const [loading, setLoading] = useState(true);
  const [enrollmentMetrics, setEnrollmentMetrics] = useState<any>(null);
  const [conversionMetrics, setConversionMetrics] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, [campaignId, dateRange]);

  async function loadMetrics() {
    try {
      setLoading(true);
      const [enrollmentData, conversionData] = await Promise.all([
        getEnrollmentMetrics(pb, campaignId, dateRange),
        getConversionMetrics(pb, campaignId, dateRange)
      ]);

      setEnrollmentMetrics(enrollmentData);
      setConversionMetrics(conversionData);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !enrollmentMetrics) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare funnel data
  const funnelData = enrollmentMetrics.step_completion_rates?.map((step: any) => ({
    name: step.step_name,
    count: step.count,
    rate: step.rate
  })) || [];

  // Prepare conversion funnel data
  const conversionFunnel = [
    { name: 'Müşteri', value: conversionMetrics?.converted_to_customer || 0, color: '#10b981' },
    { name: 'Randevu', value: conversionMetrics?.converted_to_booked || 0, color: '#3b82f6' },
    { name: 'Yeni', value: conversionMetrics?.still_new || 0, color: '#f59e0b' },
    { name: 'Kayıp', value: conversionMetrics?.lost || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Enrollment Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Kayıt Hunisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Kayıt Sayısı" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Veri bulunmuyor
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Completion Rates Table */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adım Tamamlama oranları</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adım</TableHead>
                  <TableHead className="text-right">Tamamlanan</TableHead>
                  <TableHead className="text-right">Oran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnelData.map((step: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{step.name}</TableCell>
                    <TableCell className="text-right">{step.count}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        step.rate >= 70 ? 'bg-green-100 text-green-800' :
                        step.rate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        %{step.rate}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Conversion Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dönüşüm Metrikleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversion Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Dönüşum Oranı</div>
              <div className="text-2xl font-bold text-green-700">
                %{conversionMetrics?.conversion_rate || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(conversionMetrics?.converted_to_customer || 0) + (conversionMetrics?.converted_to_booked || 0)} dönüşüm
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Ort. Tamamlama Süresi</div>
              <div className="text-2xl font-bold text-blue-700">
                {enrollmentMetrics?.avg_completion_time || 0}s
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Saat cinsinden
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Kayıt Oranı</div>
              <div className="text-2xl font-bold text-purple-700">
                %{enrollmentMetrics?.enrollment_rate || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Hedef kitleden kayıt olan
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          {conversionFunnel.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-4">Durum Dağılımı</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3">
              <div className="text-2xl font-bold text-green-600">
                {conversionMetrics?.converted_to_customer || 0}
              </div>
              <div className="text-xs text-muted-foreground">Müşteri</div>
            </div>
            <div className="text-center p-3">
              <div className="text-2xl font-bold text-blue-600">
                {conversionMetrics?.converted_to_booked || 0}
              </div>
              <div className="text-xs text-muted-foreground">Randevu</div>
            </div>
            <div className="text-center p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {conversionMetrics?.still_new || 0}
              </div>
              <div className="text-xs text-muted-foreground">Yeni</div>
            </div>
            <div className="text-center p-3">
              <div className="text-2xl font-bold text-red-600">
                {conversionMetrics?.lost || 0}
              </div>
              <div className="text-xs text-muted-foreground">Kayıp</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
