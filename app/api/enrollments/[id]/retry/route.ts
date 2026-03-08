import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { startSequence } from '@/lib/api/sequence-executor';
import type { CampaignEnrollment } from '@/types/campaign';

// Create dedicated PocketBase instance
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

// Load auth from cookie if available (for authenticated requests)
if (typeof window !== 'undefined') {
  const cookies = document.cookie.split(';');
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
  if (pbCookie) {
    try {
      pb.authStore.loadFromCookie(pbCookie.trim());
    } catch (e) {
      console.warn('Failed to load auth from cookie:', e);
    }
  }
}

/**
 * POST /api/enrollments/[id]/retry
 *
 * Retry failed step for enrollment (authenticated)
 *
 * Use cases:
 * - Manual recovery from errors
 * - Re-send failed messages
 * - Continue from failed step
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request (check for valid auth token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load auth from header
    try {
      pb.authStore.loadFromCookie(authHeader);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const enrollmentId = params.id;

    // Fetch enrollment
    const enrollment = await pb.collection('campaign_enrollments').getOne<CampaignEnrollment>(
      enrollmentId
    );

    // Reset status to active if failed or completed
    if (enrollment.status !== 'active') {
      await pb.collection('campaign_enrollments').update(enrollmentId, {
        status: 'active',
        completed_at: null
      });
    }

    // Start sequence from current step
    const result = await startSequence(pb, enrollmentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Enrollment retry started successfully',
        enrollment_id: enrollmentId
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retry enrollment',
        error: result.error
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[POST /api/enrollments/[id]/retry] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retry enrollment',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
