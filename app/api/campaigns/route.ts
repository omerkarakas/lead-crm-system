import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { validateSegment } from '@/lib/api/campaigns';
import type { AudienceSegment } from '@/types/campaign';

/**
 * GET /api/campaigns
 * Get all campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const response = await pb.collection('campaigns').getList(1, 50, {
      sort: '-created',
    });

    return NextResponse.json({
      items: response.items,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
    });
  } catch (error: any) {
    console.error('[GET /api/campaigns] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { audience_segment, ...rest } = body;

    // Validate segment
    const validation = validateSegment(audience_segment as AudienceSegment);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const campaign = await pb.collection('campaigns').create({
      ...rest,
      audience_segment,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/campaigns] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: error.status || 500 }
    );
  }
}
