import { NextRequest, NextResponse } from 'next/server';
import { sendPendingReminders } from '@/lib/api/appointments';

/**
 * GET /api/cron/send-reminders
 *
 * Cron endpoint for sending appointment reminders
 * Should be called by external cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * Security: If CRON_SECRET environment variable is set, requires Authorization header
 * Example: Authorization: Bearer your-secret-here
 *
 * For production, consider using webhook signature verification
 */
export async function GET(req: NextRequest) {
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

    // Send pending reminders
    const result = await sendPendingReminders();

    return NextResponse.json({
      success: true,
      message: 'Reminders processed',
      ...result
    });
  } catch (error) {
    console.error('[GET /api/cron/send-reminders] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint alternative for cron services that require POST
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
