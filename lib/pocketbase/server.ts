'use server';

import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

/**
 * Create a server-side PocketBase instance authenticated from cookies
 */
export async function getServerPb() {
  // Server-side kullan internal URL, client-side için NEXT_PUBLIC_POCKETBASE_URL kullanılır
  const pbUrl = process.env.POCKETBASE_INTERNAL_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

  // Debug: Log PocketBase URL
  console.log('[getServerPb] Connecting to:', pbUrl);
  console.log('[getServerPb] POCKETBASE_INTERNAL_URL:', process.env.POCKETBASE_INTERNAL_URL);
  console.log('[getServerPb] NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);

  const pb = new PocketBase(pbUrl);

  // Load auth from cookie
  const cookieStore = await cookies();
  const pbCookie = cookieStore.get('pb_auth');

  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
    console.log('[getServerPb] Auth loaded from cookie, isValid:', pb.authStore.isValid);
  } else {
    console.log('[getServerPb] No pb_auth cookie found');
  }

  return pb;
}
