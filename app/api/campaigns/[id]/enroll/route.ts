import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { enrollLeadInCampaign, checkEnrollmentEligibility } from '@/lib/api/enrollments';
import { canManageCampaigns } from '@/lib/utils/permissions';
import type { CampaignEnrollment } from '@/types/campaign';

/**
 * POST /api/campaigns/[id]/enroll
 * Enroll a lead in a campaign
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
    const { lead_id, sequence_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Verify campaign exists and is active
    try {
      const campaign = await pb.collection('campaigns').getOne(campaign_id);
      if (!campaign.is_active) {
        return NextResponse.json(
          { error: 'Campaign is not active' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check eligibility
    const eligibility = await checkEnrollmentEligibility(pb, lead_id, campaign_id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason || 'Not eligible for enrollment' },
        { status: 400 }
      );
    }

    // Enroll lead
    const enrollment = await enrollLeadInCampaign(pb, lead_id, campaign_id, sequence_id);

    console.log('[POST /api/campaigns/:id/enroll] Enrolled lead', lead_id, 'in campaign', campaign_id);

    return NextResponse.json({
      success: true,
      message: 'Lead enrolled successfully',
      enrollment,
    });
  } catch (error: any) {
    console.error('[POST /api/campaigns/:id/enroll] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to enroll lead',
      },
      { status: 500 }
    );
  }
}
