import { getServerPb } from '@/lib/pocketbase/server';
import { fetchDashboardStatsServer } from '@/lib/api/dashboard';
import { notFound } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  newLeadsMonth: number;
  qualifiedLeads: number;
  completedQA: number;
  sentQAPolls: number;
  pendingQA: number;
  statusBreakdown: Record<string, number>;
  qualityBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  conversionRates: {
    toQualified: string;
    toBooked: string;
    toCustomer: string;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    status: string;
    quality: string;
    score: number;
    created: string;
  }>;
  bookedLeads: number;
  customerLeads: number;
}

export default async function DashboardPage() {
  const pb = await getServerPb();

  if (!pb.authStore.isValid) {
    return notFound();
  }

  const stats: DashboardStats = await fetchDashboardStatsServer(pb);

  return <DashboardClient initialStats={stats} />;
}
