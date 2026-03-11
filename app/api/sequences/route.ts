import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';

/**
 * GET /api/sequences
 * Get sequences by campaign_id
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
    }

    const response = await pb.collection('sequences').getList(1, 100, {
      filter: `campaign_id = "${campaignId}"`,
      sort: '-created',
    });

    return NextResponse.json({
      items: response.items,
      totalItems: response.totalItems,
    });
  } catch (error: any) {
    console.error('[GET /api/sequences] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sequences' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/sequences
 * Create a new sequence
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    console.log('[POST /api/sequences] Auth check:', { user: user?.id, role: user?.role });

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    console.log('[POST /api/sequences] Received body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      console.log('[POST /api/sequences] Validation failed: name is empty');
      return NextResponse.json(
        { error: 'Sequence name is required' },
        { status: 400 }
      );
    }

    if (!body.campaign_id) {
      console.log('[POST /api/sequences] Validation failed: campaign_id is empty');
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    const sequenceData = {
      name: body.name.trim(),
      campaign_id: body.campaign_id,
      steps: body.steps || [],
      is_active: body.is_active ?? true,
      createdBy: user.id,
      updatedBy: user.id,
    };

    console.log('[POST /api/sequences] Creating sequence with data:', JSON.stringify(sequenceData, null, 2));

    const sequence = await pb.collection('sequences').create(sequenceData);

    console.log('[POST /api/sequences] Sequence created successfully:', sequence.id);

    return NextResponse.json(sequence, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/sequences] Error:', error);
    console.error('[POST /api/sequences] Error data:', error.data);
    console.error('[POST /api/sequences] Error message:', error.message);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create sequence',
        details: error.data || error,
      },
      { status: error.status || 500 }
    );
  }
}
