import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/campaigns/[id]/sequences
 * Get all sequences for a campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const response = await pb.collection('sequences').getList(1, 100, {
      filter: `campaign_id = "${context.params.id}"`,
      sort: 'created',
    });

    return NextResponse.json(response.items);
  } catch (error: any) {
    console.error(`[GET /api/campaigns/${context.params.id}/sequences] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sequences' },
      { status: error.status || 500 }
    );
  }
}
