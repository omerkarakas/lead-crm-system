import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageProposalTemplates } from '@/lib/utils/permissions';

/**
 * GET /api/proposal-templates
 * Get active proposal templates (or archived if ?archived=true)
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const archived = searchParams.get('archived') === 'true';

    const filter = archived
      ? 'is_deleted = true'
      : 'is_active = true && is_deleted = false';

    const response = await pb.collection('proposal_templates').getList(1, 100, {
      filter,
      sort: 'name',
    });

    return NextResponse.json(response.items);
  } catch (error: any) {
    console.error('[GET /api/proposal-templates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/proposal-templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageProposalTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const template = await pb.collection('proposal_templates').create({
      ...body,
      is_active: body.is_active ?? true,
      is_deleted: false,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/proposal-templates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: error.status || 500 }
    );
  }
}
