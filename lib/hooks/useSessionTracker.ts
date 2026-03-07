import { useEffect } from 'react';
import pb from '@/lib/pocketbase';
import { useAuthStore } from '@/lib/stores/auth';

/**
 * Hook to update session lastActive time periodically
 * This keeps the session record fresh while user is active
 */
export function useSessionTracker() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Update lastActive every 2 minutes
    const interval = setInterval(async () => {
      const user = pb.authStore.model;
      const token = pb.authStore.token;

      if (user && token) {
        try {
          // Find current session by token and update lastActive
          const sessions = await pb.collection('sessions').getList(1, 50, {
            filter: `token = "${token}"`,
          });

          if (sessions.items.length > 0) {
            const session = sessions.items[0];
            await pb.collection('sessions').update(session.id, {
              lastActive: new Date().toISOString(),
            });
          }
        } catch (error) {
          // Silently fail - session tracking shouldn't break the app
          console.error('Failed to update session:', error);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);
}
