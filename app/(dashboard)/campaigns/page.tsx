import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/auth-utils';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { CampaignsClient } from './client';

export default async function CampaignsPage() {
  const user = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  if (!canManageCampaigns(user.role)) {
    redirect('/leads');
  }

  return <CampaignsClient />;
}
