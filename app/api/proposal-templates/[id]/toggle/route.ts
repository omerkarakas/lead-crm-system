import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageProposalTemplates } from '@/lib/utils/permissions';

/**
 * POST /api/proposal-templates/[id]/toggle
 * Toggle template active status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = '';
  let body: any = null;

  try {
    const resolvedParams = await params;
    id = resolvedParams.id;

    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageProposalTemplates(user?.role)) {
      return NextResponse.json({ error: 'Forbidden - You do not have permission to manage proposal templates' }, { status: 403 });
    }

    body = await request.json();

    // Debug log
    console.log('Toggle template - id:', id, 'isActive:', body.isActive, 'type:', typeof body.isActive);

    const template = await pb.collection('proposal_templates').update(id, {
      is_active: Boolean(body.isActive),
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[POST /api/proposal-templates/[id]/toggle] Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      data: error.data,
      id,
      body
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to toggle template',
        details: error.data?.message || error.message
      },
      { status: error.status || 500 }
    );
  }
}
