import { redirect } from 'next/navigation';
import pb from '@/lib/pocketbase';
import type { Campaign, CampaignEnrollment, Sequence } from '@/types/campaign';
import { ExecutionPageClient } from './client';

interface ExecutionPageProps {
  params: {
    id: string;
  };
  searchParams: {
    status?: string;
    search?: string;
  };
}

async function getCampaign(id: string): Promise<Campaign> {
  try {
    const campaign = await pb.collection('campaigns').getOne<Campaign>(id);
    return campaign;
  } catch (error) {
    console.error('Failed to fetch campaign:', error);
    redirect('/campaigns');
  }
}

async function getSequences(campaignId: string): Promise<Sequence[]> {
  try {
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

async function getEnrollments(campaignId: string): Promise<CampaignEnrollment[]> {
  try {
    const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
      1,
      500,
      {
        filter: `campaign_id = "${campaignId}"`,
        sort: '-enrolled_at',
        expand: 'lead_id,sequence_id'
      }
    );
    return response.items;
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
    return [];
  }
}

export default async function ExecutionPage({ params, searchParams }: ExecutionPageProps) {
  const campaign = await getCampaign(params.id);
  const sequences = await getSequences(params.id);
  const enrollments = await getEnrollments(params.id);

  // Calculate stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    failed: enrollments.filter(e => e.status === 'failed').length
  };

  return (
    <ExecutionPageClient
      campaign={campaign}
      sequences={sequences}
      enrollments={enrollments}
      stats={stats}
      initialStatus={searchParams.status}
      initialSearch={searchParams.search}
    />
  );
}
