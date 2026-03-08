import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { startSequence } from '@/lib/api/sequence-executor';
import { enrollLeadInCampaign } from '@/lib/api/enrollments';
import type { Sequence, Campaign } from '@/types/campaign';

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
 * POST /api/sequences/[id]/start
 *
 * Manual sequence start endpoint (authenticated)
 * Body: { lead_id }
 *
 * Use cases:
 * - Admin manually starts sequence for lead
 * - Testing sequence execution
 * - Re-starting failed sequences
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

    const sequenceId = params.id;
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { success: false, message: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Fetch sequence to get campaign_id
    const sequence = await pb.collection('sequences').getOne<Sequence>(sequenceId);
    const campaignId = sequence.campaign_id;

    // Find or create enrollment
    let enrollmentId: string | null = null;

    try {
      // Try to enroll lead in campaign
      const enrollment = await enrollLeadInCampaign(pb, lead_id, campaignId, sequenceId);
      enrollmentId = enrollment.id;
    } catch (error: any) {
      // If already enrolled, find existing enrollment
      if (error.message?.includes('already enrolled')) {
        const existingEnrollments = await pb.collection('campaign_enrollments').getList(1, 1, {
          filter: `lead_id = "${lead_id}" && campaign_id = "${campaignId}" && sequence_id = "${sequenceId}"`
        });

        if (existingEnrollments.items.length > 0) {
          enrollmentId = existingEnrollments.items[0].id;

          // If enrollment is failed or completed, reset it to active
          const enrollment = existingEnrollments.items[0];
          if (enrollment.status !== 'active') {
            await pb.collection('campaign_enrollments').update(enrollmentId, {
              status: 'active',
              current_step: 0,
              completed_at: null,
              next_step_scheduled: null
            });
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, message: 'Failed to find or create enrollment' },
        { status: 500 }
      );
    }

    // Start sequence
    const result = await startSequence(pb, enrollmentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sequence started successfully',
        enrollment_id: enrollmentId,
        first_step_scheduled: true
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to start sequence',
        error: result.error
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[POST /api/sequences/[id]/start] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to start sequence',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
