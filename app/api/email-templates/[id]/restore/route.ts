import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageEmailTemplates } from '@/lib/utils/permissions';

/**
 * POST /api/email-templates/[id]/restore
 * Restore an archived email template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageEmailTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const template = await pb.collection('email_templates').update(id, {
      is_deleted: false,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[POST /api/email-templates/[id]/restore] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore template' },
      { status: error.status || 500 }
    );
  }
}
