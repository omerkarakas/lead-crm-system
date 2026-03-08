import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { unenrollLeadFromCampaign } from '@/lib/api/enrollments';
import { canManageCampaigns } from '@/lib/utils/permissions';
import type { CampaignEnrollment } from '@/types/campaign';

/**
 * POST /api/campaigns/[id]/unenroll
 * Unsubscribe a lead from a campaign
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaign_id } = await params;
    const pb = await getServerPb();

    // Check authentication
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const user = pb.authStore.model as any;
    if (!canManageCampaigns(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Find enrollment by lead_id and campaign_id
    const enrollments = await pb.collection('campaign_enrollments').getList(1, 1, {
      filter: `lead_id = "${lead_id}" && campaign_id = "${campaign_id}"`,
    });

    if (enrollments.totalItems === 0) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const enrollment = enrollments.items[0];

    // Unsubscribe
    const updated = await unenrollLeadFromCampaign(pb, enrollment.id);

    console.log('[POST /api/campaigns/:id/unenroll] Unsubscribed lead', lead_id, 'from campaign', campaign_id);

    return NextResponse.json({
      success: true,
      message: 'Lead unsubscribed successfully',
      enrollment: updated,
    });
  } catch (error: any) {
    console.error('[POST /api/campaigns/:id/unenroll] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unsubscribe lead',
      },
      { status: 500 }
    );
  }
}
