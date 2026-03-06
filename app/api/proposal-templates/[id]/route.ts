import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageProposalTemplates } from '@/lib/utils/permissions';

/**
 * GET /api/proposal-templates/[id]
 * Get a single template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await pb.collection('proposal_templates').getOne(id, {
      filter: 'is_deleted = false',
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[GET /api/proposal-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: error.status || 500 }
    );
  }
}

/**
 * PATCH /api/proposal-templates/[id]
 * Update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageProposalTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const template = await pb.collection('proposal_templates').update(id, body);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[PATCH /api/proposal-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/proposal-templates/[id]
 * Soft delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageProposalTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const template = await pb.collection('proposal_templates').update(id, {
      is_deleted: true,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[DELETE /api/proposal-templates/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: error.status || 500 }
    );
  }
}
