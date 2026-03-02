import { create } from 'zustand';
import pb from '@/lib/pocketbase';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      set({
        user: authData.record as unknown as User,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    pb.authStore.clear();
    // Also clear the cookie
    if (typeof window !== 'undefined') {
      document.cookie = 'pb_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    set({ user: null, isAuthenticated: false });
  },

  refreshSession: async () => {
    try {
      const authData = await pb.collection('users').authRefresh();
      set({
        user: authData.record as unknown as User,
        isAuthenticated: true
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      throw error;
    }
  },

  checkAuth: () => {
    // Check if we have a valid auth store
    const user = pb.authStore.model as unknown as User | null;
    const isValid = pb.authStore.isValid;

    set({
      user,
      isAuthenticated: isValid && !!user,
      isLoading: false
    });
  }
}));
