import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { autoEnrollLead } from '@/lib/api/enrollments';
import { fetchLead } from '@/lib/api/leads';
import type { Lead } from '@/types/lead';
import { verifyWebhookApiKey } from '@/lib/utils/webhook-signature';

/**
 * POST /api/webhooks/qa-complete
 * Webhook endpoint called when QA is completed
 * Automatically enrolls low-score leads in nurturing campaigns
 *
 * Security: Verifies X-Webhook-Key header
 */
export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    // Verify webhook API key
    if (!verifyWebhookApiKey(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid webhook key' },
        { status: 401 }
      );
    }

    // Parse request body
    body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Create PocketBase instance (no auth needed for webhook)
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

    // Fetch lead with score and quality
    const lead = await fetchLead(lead_id);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Only auto-enroll if quality is 'pending' (low score)
    if (lead.quality !== 'pending') {
      console.log('[QA Complete Webhook] Lead quality is not pending, skipping auto-enrollment:', lead_id);
      return NextResponse.json({
        success: true,
        enrolled: 0,
        campaigns: [],
        message: 'Lead quality is qualified, no auto-enrollment needed',
      });
    }

    // Fetch active campaigns with auto_enroll_min_score
    const campaigns = await pb.collection('campaigns').getList(1, 100, {
      filter: 'is_active = true && auto_enroll_min_score != null',
    });

    // Filter campaigns where lead.score <= auto_enroll_min_score
    const eligibleCampaigns = campaigns.items.filter(
      (c: any) => c.auto_enroll_min_score !== undefined && lead.score <= c.auto_enroll_min_score
    );

    if (eligibleCampaigns.length === 0) {
      console.log('[QA Complete Webhook] No eligible campaigns for lead:', lead_id);
      return NextResponse.json({
        success: true,
        enrolled: 0,
        campaigns: [],
        message: 'No matching campaigns found',
      });
    }

    // Auto-enroll in eligible campaigns
    const result = await autoEnrollLead(pb, lead);

    console.log('[QA Complete Webhook] Enrolled lead', lead_id, 'in', result.enrolled, 'campaigns');

    return NextResponse.json({
      success: true,
      enrolled: result.enrolled,
      campaigns: result.campaigns.map((c) => ({ id: c.id, name: c.name })),
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[QA Complete Webhook] Error:', error);
    // Log structured error
    console.log(JSON.stringify({
      event: 'qa_complete_webhook',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lead_id: body?.lead_id,
    }));

    // Return 200 OK to prevent retries (fire-and-forget pattern)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Auto-enrollment failed',
      },
      { status: 200 }
    );
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'qa-complete',
  });
}
