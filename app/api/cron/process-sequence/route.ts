import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import {
  processNextStep,
  getExecutionHistory
} from '@/lib/api/sequence-executor';
import type { CampaignEnrollment } from '@/types/campaign';

// Create dedicated PocketBase instance
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

/**
 * POST /api/cron/process-sequence
 *
 * Cron endpoint for processing due sequence enrollments
 * Should be called by external cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * Security: If CRON_SECRET environment variable is set, requires Authorization header
 * Example: Authorization: Bearer your-secret-here
 *
 * Batch processing: Processes enrollments in batches of 50 to avoid timeout
 */
export async function POST(req: NextRequest) {
  try {
    // Check for CRON_SECRET if configured
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const authHeader = req.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (token !== cronSecret) {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 403 }
        );
      }
    }

    const startTime = Date.now();
    let processed = 0;
    let successes = 0;
    let failures = 0;
    const errors: Array<{ enrollment_id: string; error: string }> = [];

    // Find all active enrollments where next step is due
    // Query: status = 'active' AND next_step_scheduled <= now
    const now = new Date().toISOString();

    // Fetch in batches
    const batchSize = 50;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
          page,
          batchSize,
          {
            filter: `status = 'active' && next_step_scheduled != null && next_step_scheduled <= '${now}'`,
            sort: 'next_step_scheduled'
          }
        );

        if (response.items.length === 0) {
          hasMore = false;
          break;
        }

        // Process each enrollment
        for (const enrollment of response.items) {
          processed++;

          try {
            const result = await processNextStep(pb, enrollment.id);

            if (result.success) {
              successes++;
            } else {
              failures++;
              errors.push({
                enrollment_id: enrollment.id,
                error: result.error || 'Unknown error'
              });
            }
          } catch (error: any) {
            failures++;
            errors.push({
              enrollment_id: enrollment.id,
              error: error.message || 'Unknown error'
            });
            console.error('[POST /api/cron/process-sequence] Error processing enrollment', enrollment.id, error);
          }
        }

        // Check if there are more pages
        if (response.items.length < batchSize) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error: any) {
        console.error('[POST /api/cron/process-sequence] Error fetching batch:', error);
        hasMore = false;
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Sequence processing completed',
      processed,
      successes,
      failures,
      errors: errors.slice(0, 10), // Return first 10 errors
      duration: `${duration}ms`
    });
  } catch (error) {
    console.error('[POST /api/cron/process-sequence] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process sequences',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint alternative for cron services that require GET
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
