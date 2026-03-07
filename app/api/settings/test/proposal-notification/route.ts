import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageSettings } from '@/lib/utils/permissions';
import { sendTestProposalNotification } from '@/lib/api/notifications';

/**
 * POST /api/settings/test/proposal-notification
 * Send a test proposal notification to verify configuration
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();

    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.model as any;
    if (!canManageSettings(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const message = body.message; // Optional custom message

    const result = await sendTestProposalNotification(pb, message);

    return NextResponse.json({
      success: result.success,
      notified_count: result.notified_count,
      message: result.notified_count > 0
        ? 'Test bildirimi gönderildi'
        : (result.errors[0] || 'Bildirim gönderilemedi. Ayarları kontrol edin.'),
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[POST /api/settings/test/proposal-notification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
