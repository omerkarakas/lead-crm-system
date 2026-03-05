'use server';

import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

/**
 * Create a server-side PocketBase instance authenticated from cookies
 */
export async function getServerPb() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

  // Load auth from cookie
  const cookieStore = await cookies();
  const pbCookie = cookieStore.get('pb_auth');

  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
  }

  return pb;
}
