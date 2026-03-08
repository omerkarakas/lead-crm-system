import { redirect } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { AnalyticsPageClient } from './client';

interface AnalyticsPageProps {
  params: {
    id: string;
  };
}

async function getCampaign(id: string) {
  try {
    const campaign = await pb.collection('campaigns').getOne(id);
    return campaign;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    redirect('/campaigns');
  }
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const campaign = await getCampaign(params.id);

  return <AnalyticsPageClient campaignId={campaign.id} campaignName={campaign.name} />;
}
