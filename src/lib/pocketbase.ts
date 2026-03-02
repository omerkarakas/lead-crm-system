import PocketBase from 'pocketbase';

// Initialize PocketBase client with environment variable or default local URL
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(pbUrl);

// Enable authStore persistence - this will persist the auth state across page refreshes
pb.authStore.loadFromCookie(document.cookie);

// Save authStore to cookie on any change (automatically handled by PocketBase)
pb.authStore.onChange(() => {
  pb.authStore.exportToCookie({ httpOnly: false });
}, true);

export default pb;
