import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageCampaigns } from '@/lib/utils/permissions';

/**
 * POST /api/sequences
 * Create a new sequence
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    if (!user || !canManageCampaigns(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const sequence = await pb.collection('sequences').create(body);

    return NextResponse.json(sequence, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/sequences] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sequence' },
      { status: error.status || 500 }
    );
  }
}
