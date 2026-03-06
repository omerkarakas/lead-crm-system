import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageProposalTemplates } from '@/lib/utils/permissions';

/**
 * POST /api/proposal-templates/[id]/restore
 * Restore a deleted template
 */
export async function POST(
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
      is_deleted: false,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[POST /api/proposal-templates/[id]/restore] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore template' },
      { status: error.status || 500 }
    );
  }
}
