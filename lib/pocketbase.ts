import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Load auth token from cookie/document on client-side
if (typeof window !== 'undefined') {
  // Try to load from cookie first
  const cookies = document.cookie.split(';');
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));

  if (pbCookie) {
    try {
      pb.authStore.loadFromCookie(pbCookie.trim());
    } catch (e) {
      console.warn('Failed to load auth from cookie:', e);
    }
  }
}

// Persist auth state to cookie whenever it changes
pb.authStore.onChange(() => {
  if (typeof window !== 'undefined') {
    document.cookie = pb.authStore.exportToCookie({
      httpOnly: false, // Allow client-side access for our auth store
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
});

export default pb;
