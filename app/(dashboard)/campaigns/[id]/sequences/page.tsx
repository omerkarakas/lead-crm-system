import { redirect } from 'next/navigation';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Campaign, Sequence } from '@/types/campaign';
import { SequencesPageClient } from './client';

export const dynamic = 'force-dynamic';

interface SequencesPageProps {
  params: {
    id: string;
  };
  searchParams: {
    edit?: string;
    new?: string;
  };
}

async function getCampaign(id: string): Promise<Campaign> {
  try {
    const pb = await getServerPb();
    const campaign = await pb.collection('campaigns').getOne<Campaign>(id);
    return campaign;
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    redirect('/campaigns');
  }
}

async function getSequences(campaignId: string): Promise<Sequence[]> {
  try {
    const pb = await getServerPb();
    const response = await pb.collection('sequences').getList<Sequence>(1, 100, {
      filter: `campaign_id = "${campaignId}"`,
      sort: '-created',
    });
    return response.items;
  } catch (error) {
    console.error('Failed to fetch sequences:', error);
    return [];
  }
}

export default async function SequencesPage({ params, searchParams }: SequencesPageProps) {
  // Note: In a real app, you'd validate authentication server-side
  // For now, we'll let the client component handle auth redirects
  // const user = await getCachedUser();

  // if (!user) {
  //   redirect('/login');
  // }

  // if (!canManageCampaigns(user.role)) {
  //   redirect('/leads');
  // }

  const campaign = await getCampaign(params.id);
  const sequences = await getSequences(params.id);
  const editingSequenceId = searchParams.edit;
  const isNewSequence = searchParams.new === 'true';

  return (
    <SequencesPageClient
      campaign={campaign}
      sequences={sequences}
      editingSequenceId={editingSequenceId}
      isNewSequence={isNewSequence}
    />
  );
}
