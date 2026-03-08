import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';

type RouteContext = {
  params: { id: string };
};

/**
 * PATCH /api/sequences/[id]
 * Update a sequence
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const sequence = await pb.collection('sequences').update(context.params.id, body);

    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error(`[PATCH /api/sequences/${context.params.id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sequence' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/sequences/[id]
 * Delete a sequence
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pb.collection('sequences').delete(context.params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[DELETE /api/sequences/${context.params.id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete sequence' },
      { status: error.status || 500 }
    );
  }
}
