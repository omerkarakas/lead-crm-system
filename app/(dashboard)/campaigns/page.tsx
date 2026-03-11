'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { CampaignsClient } from './client';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !canManageCampaigns(user.role)) {
      router.push('/leads');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user || !canManageCampaigns(user.role)) {
    return null;
  }

  return <CampaignsClient />;
}
