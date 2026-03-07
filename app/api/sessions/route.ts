import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';

/**
 * DELETE /api/sessions?id=xxx
 * Revoke (delete) a specific session
 * Uses PocketBase API rules for access control
 */
export async function DELETE(request: NextRequest) {
  try {
    const pb = await getServerPb();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    await pb.collection('sessions').delete(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
