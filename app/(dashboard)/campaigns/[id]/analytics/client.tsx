'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import PerformanceDashboard from '@/components/campaigns/PerformanceDashboard';
import pb from '@/lib/pocketbase';

interface AnalyticsPageClientProps {
  campaignId: string;
  campaignName: string;
}

export function AnalyticsPageClient({ campaignId, campaignName }: AnalyticsPageClientProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication on mount
    if (!pb.authStore.isValid) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <a href="/campaigns" className="hover:text-foreground">
          Kampanyalar
        </a>
        <span>/</span>
        <a href={`/campaigns/${campaignId}`} className="hover:text-foreground">
          {campaignName}
        </a>
        <span>/</span>
        <span className="text-foreground">Analitik</span>
      </nav>

      {/* Dashboard */}
      <PerformanceDashboard
        campaignId={campaignId}
        campaignName={campaignName}
        pb={pb}
      />
    </div>
  );
}
