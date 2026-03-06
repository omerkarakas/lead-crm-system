import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageEmailTemplates } from '@/lib/utils/permissions';

/**
 * GET /api/email-templates/[id]
 * Get a single email template
 */
export async function GET(
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

    const template = await pb.collection('email_templates').getOne(id);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[GET /api/email-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: error.status || 500 }
    );
  }
}

/**
 * PATCH /api/email-templates/[id]
 * Update an email template
 */
export async function PATCH(
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
    const template = await pb.collection('email_templates').update(id, body);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[PATCH /api/email-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/email-templates/[id]
 * Archive (soft delete) an email template
 */
export async function DELETE(
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
      is_deleted: true,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[DELETE /api/email-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive template' },
      { status: error.status || 500 }
    );
  }
}
