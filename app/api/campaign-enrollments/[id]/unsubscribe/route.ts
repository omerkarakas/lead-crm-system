import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { unenrollLeadFromCampaign } from '@/lib/api/enrollments';
import { canManageCampaigns } from '@/lib/utils/permissions';

/**
 * POST /api/campaign-enrollments/[id]/unsubscribe
 * Unsubscribe from a campaign enrollment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Unsubscribe
    const enrollment = await unenrollLeadFromCampaign(pb, id);

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
      enrollment,
    });
  } catch (error: any) {
    console.error('[POST /api/campaign-enrollments/:id/unsubscribe] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unsubscribe',
      },
      { status: 500 }
    );
  }
}
