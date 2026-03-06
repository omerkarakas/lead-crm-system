import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageEmailTemplates } from '@/lib/utils/permissions';

/**
 * GET /api/email-templates
 * Get all email templates
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageEmailTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived') === 'true';

    const filter = archived ? 'is_deleted = true' : 'is_deleted = false';

    const response = await pb.collection('email_templates').getList(1, 100, {
      filter,
      sort: 'name',
    });

    return NextResponse.json(response.items);
  } catch (error: any) {
    console.error('[GET /api/email-templates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/email-templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageEmailTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const template = await pb.collection('email_templates').create({
      ...body,
      is_deleted: false,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/email-templates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: error.status || 500 }
    );
  }
}
