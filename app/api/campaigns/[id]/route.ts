import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { fetchSequences } from '@/lib/api/campaigns';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/campaigns/[id]
 * Get a single campaign with sequences
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await pb.collection('campaigns').getOne(context.params.id);
    const sequences = await fetchSequences(context.params.id);

    return NextResponse.json({
      ...campaign,
      sequences,
    });
  } catch (error: any) {
    console.error(`[GET /api/campaigns/${context.params.id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign' },
      { status: error.status || 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Update a campaign
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const campaign = await pb.collection('campaigns').update(context.params.id, body);

    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error(`[PATCH /api/campaigns/${context.params.id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update campaign' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign (soft delete)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await pb.collection('campaigns').update(context.params.id, {
      is_active: false,
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error(`[DELETE /api/campaigns/${context.params.id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete campaign' },
      { status: error.status || 500 }
    );
  }
}
