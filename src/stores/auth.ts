import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import pb from '@/lib/pocketbase';
import type { UserRecord, OAuthProvider } from '@/types/pocketbase';
import { ROLE_PERMISSIONS } from '@/types/permissions';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserRecord | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!user.value && pb.authStore.isValid);

  const isAdmin = computed(() => user.value?.role === 'admin');
  const isSales = computed(() => user.value?.role === 'sales');
  const isMarketing = computed(() => user.value?.role === 'marketing');

  // Initialize auth from persisted storage
  function initAuth() {
    // PocketBase authStore loads from cookie/document automatically
    // We just need to sync our user state
    if (pb.authStore.isValid && pb.authStore.model) {
      user.value = pb.authStore.model as UserRecord;
    }

    // Listen to auth changes
    pb.authStore.onChange((_token, model) => {
      if (model) {
        user.value = model as UserRecord;
      } else {
        user.value = null;
      }
    }, true); // immediate = true to fire immediately with current state
  }

  // Login with email and password
  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      user.value = authData.record as UserRecord;
      return authData;
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Login with OAuth
  async function loginWithOAuth(provider: OAuthProvider) {
    loading.value = true;
    error.value = null;

    try {
      // PocketBase will redirect to OAuth provider
      // After OAuth flow, user will be redirected back with code/state
      const authData = await pb.collection('users').authWithOAuth2({
        provider: provider,
        // Create/redirect URL for callback
        urlCallback: (_url) => {
          // Redirect to OAuth provider
          // Note: PocketBase handles OAuth redirect automatically
          // The callback URL is managed by PocketBase's OAuth2 flow
        }
      });

      // This part only runs if OAuth completes synchronously (unlikely for OAuth2)
      user.value = authData.record as UserRecord;
      return authData;
    } catch (err: any) {
      error.value = err.message || 'OAuth login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    return loginWithOAuth('google');
  }

  // Login with GitHub
  async function loginWithGitHub() {
    return loginWithOAuth('github');
  }

  // Handle OAuth callback
  // This should be called on page load if URL contains OAuth code/state
  async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      loading.value = true;
      try {
        // PocketBase handles OAuth callback automatically via authWithOAuth2
        // The callback URL should match what was configured in OAuth provider
        // PocketBase will have set the auth store during the redirect
        if (pb.authStore.isValid && pb.authStore.model) {
          user.value = pb.authStore.model as UserRecord;
        }

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err: any) {
        error.value = err.message || 'OAuth callback failed';
        throw err;
      } finally {
        loading.value = false;
      }
    }
  }

  // Logout
  function logout() {
    pb.authStore.clear();
    user.value = null;
    error.value = null;
  }

  // Request password reset
  async function requestPasswordReset(email: string) {
    loading.value = true;
    error.value = null;

    try {
      await pb.collection('users').requestPasswordReset(email);
    } catch (err: any) {
      error.value = err.message || 'Password reset request failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Reset password with token
  async function resetPassword(token: string, password: string, confirmPassword: string) {
    loading.value = true;
    error.value = null;

    try {
      await pb.collection('users').confirmPasswordReset(
        token,
        password,
        confirmPassword
      );
    } catch (err: any) {
      error.value = err.message || 'Password reset failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Export user permissions for convenience
  const userPermissions = computed(() => {
    if (!user.value) return [];
    return ROLE_PERMISSIONS[user.value.role] || [];
  });

  return {
    // State
    user,
    loading,
    error,
    // Computed
    isAuthenticated,
    isAdmin,
    isSales,
    isMarketing,
    userPermissions,
    // Actions
    initAuth,
    login,
    loginWithGoogle,
    loginWithGitHub,
    handleOAuthCallback,
    logout,
    requestPasswordReset,
    resetPassword
  };
});
