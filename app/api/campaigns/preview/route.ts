import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';
import { getSegmentPreview } from '@/lib/api/campaigns';
import type { AudienceSegment } from '@/types/campaign';

/**
 * POST /api/campaigns/preview
 * Get segment preview with lead count and sample leads
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const segment: AudienceSegment = await request.json();
    const preview = await getSegmentPreview(segment);

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('[POST /api/campaigns/preview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get segment preview' },
      { status: error.status || 500 }
    );
  }
}
