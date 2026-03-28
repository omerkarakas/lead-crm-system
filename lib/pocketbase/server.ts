'use server';

import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

/**
 * Create a server-side PocketBase instance authenticated from cookies
 * With cache bypassing for production reliability
 */
export async function getServerPb() {
  // Server-side use internal URL for Docker communication
  const pbUrl = process.env.POCKETBASE_INTERNAL_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

  // Debug logging
  console.log('[getServerPb] Initializing PocketBase instance');
  console.log('[getServerPb] URL:', pbUrl);
  console.log('[getServerPb] POCKETBASE_INTERNAL_URL:', process.env.POCKETBASE_INTERNAL_URL);
  console.log('[getServerPb] NEXT_PUBLIC_POCKETBASE_URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);

  const pb = new PocketBase(pbUrl);

  // Disable PocketBase's internal cache
  // PocketBase SDK has built-in caching that can cause stale data issues
  pb.beforeSend = function (url, options) {
    // Add cache-busting headers to all requests
    options.headers = options.headers || {};
    options.headers['Cache-Control'] = 'no-cache';
    options.headers['Pragma'] = 'no-cache';
    return { url, options };
  };

  // Load auth from cookie
  const cookieStore = cookies();
  const pbCookie = cookieStore.get('pb_auth');

  if (pbCookie) {
    pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
    console.log('[getServerPb] Auth loaded from cookie');
    console.log('[getServerPb] Auth valid:', pb.authStore.isValid);
    console.log('[getServerPb] Auth model:', pb.authStore.model?.id || 'none');

    // Try to refresh auth if needed, but don't fail if it doesn't work
    if (pb.authStore.isValid) {
      pb.collection('users').authRefresh()
        .then(() => console.log('[getServerPb] Auth refreshed successfully'))
        .catch((err) => console.warn('[getServerPb] Auth refresh failed (non-blocking):', err.message));
    }
  } else {
    console.log('[getServerPb] No pb_auth cookie found');
  }

  return pb;
}
