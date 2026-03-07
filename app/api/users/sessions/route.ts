import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';

/**
 * GET /api/users/sessions?userId=xxx
 * Fetch sessions for a user
 * Uses PocketBase API rules for access control
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const sessions = await pb.collection('sessions').getList(1, 50, {
      filter: `userId = "${userId}"`,
      sort: '-lastActive',
    });

    return NextResponse.json({
      items: sessions.items,
      totalItems: sessions.totalItems,
      totalPages: sessions.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/users/sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
