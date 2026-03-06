import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageEmailTemplates } from '@/lib/utils/permissions';

/**
 * POST /api/email-templates/[id]/toggle
 * Toggle email template active status
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

    const body = await request.json();
    const template = await pb.collection('email_templates').update(id, {
      is_active: body.isActive,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[POST /api/email-templates/[id]/toggle] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle template' },
      { status: error.status || 500 }
    );
  }
}
