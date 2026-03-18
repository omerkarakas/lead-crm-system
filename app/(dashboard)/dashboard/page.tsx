import { getServerPb } from "@/lib/pocketbase/server";
import { fetchDashboardStatsServer } from "@/lib/api/dashboard";
import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

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
  changes?: {
    totalLeads: number;
    newLeadsToday: number;
    qualifiedLeads: number;
    pendingQA: number;
  };
}

export default async function DashboardPage() {
  const pb = await getServerPb();
  if (!pb.authStore.isValid) {
    return notFound();
  }

  let stats: DashboardStats;
  try {
    stats = await fetchDashboardStatsServer(pb);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    // Return fallback stats with -1 values to indicate error
    stats = {
      totalLeads: -1,
      newLeadsToday: -1,
      newLeadsWeek: -1,
      newLeadsMonth: -1,
      qualifiedLeads: -1,
      completedQA: -1,
      sentQAPolls: -1,
      pendingQA: -1,
      statusBreakdown: {},
      qualityBreakdown: {},
      sourceBreakdown: {},
      conversionRates: { toQualified: "0", toBooked: "0", toCustomer: "0" },
      recentLeads: [],
      bookedLeads: -1,
      customerLeads: -1,
      changes: {
        totalLeads: 0,
        newLeadsToday: 0,
        qualifiedLeads: 0,
        pendingQA: 0,
      },
    };
  }

  return <DashboardClient initialStats={stats} />;
}
