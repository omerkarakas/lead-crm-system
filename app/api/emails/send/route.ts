import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { sendEmailToLead as sendEmailToLeadAPI } from '@/lib/api/email';
import { canSendEmails } from '@/lib/utils/permissions';

/**
 * POST /api/emails/send
 * Send email to a lead
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canSendEmails(user?.role)) {
      return NextResponse.json({ error: 'Forbidden - You do not have permission to send emails' }, { status: 403 });
    }

    const requestBody = await request.json();
    const { lead_id, subject, body, template_id } = requestBody;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const result = await sendEmailToLeadAPI(lead_id, {
      subject,
      body,
      template_id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/emails/send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
