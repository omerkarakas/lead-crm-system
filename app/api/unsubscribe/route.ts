import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { unsubscribeByToken } from '@/lib/api/enrollments';

/**
 * POST /api/unsubscribe
 * Public endpoint to unsubscribe via token
 * No authentication required
 */
export async function POST(req: NextRequest) {
  try {
    const pb = await getServerPb();

    // Parse request body
    const body = await req.json();
    const { token, campaign_ids } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // Unsubscribe
    const result = await unsubscribeByToken(pb, token, campaign_ids);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 400 }
      );
    }

    console.log('[POST /api/unsubscribe] Unsubscribed from', result.unsubscribed, 'campaigns');

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from ${result.unsubscribed} campaign(s)`,
      unsubscribed: result.unsubscribed,
    });
  } catch (error: any) {
    console.error('[POST /api/unsubscribe] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to unsubscribe',
      },
      { status: 500 }
    );
  }
}
