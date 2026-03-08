import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { CampaignEnrollment } from '@/types/campaign';

/**
 * GET /api/campaign-enrollments?lead_id={id}
 * Get all enrollments for a lead
 */
export async function GET(req: NextRequest) {
  try {
    const pb = await getServerPb();

    // Check authentication
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get('lead_id');

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Fetch enrollments with expanded campaign and sequence data
    const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
      1,
      100,
      {
        filter: `lead_id = "${lead_id}"`,
        sort: '-enrolled_at',
        expand: 'campaign_id,sequence_id',
      }
    );

    return NextResponse.json({
      items: response.items,
      totalItems: response.totalItems,
    });
  } catch (error: any) {
    console.error('[GET /api/campaign-enrollments] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch enrollments',
      },
      { status: 500 }
    );
  }
}
