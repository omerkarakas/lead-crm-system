import pb from '@/lib/pocketbase';
import type { User, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData } from '@/types/auth';

/**
 * Authenticate user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const authData = await pb.collection('users').authWithPassword(
    credentials.email,
    credentials.password
  );
  return authData.record as unknown as User;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  pb.authStore.clear();
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<User> {
  const userData = {
    email: data.email,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    name: data.name,
    role: data.role || 'sales',
  };

  const record = await pb.collection('users').create<User>(userData);
  return record;
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<void> {
  await pb.collection('users').requestPasswordReset(email);
}

/**
 * Reset password with token from email
 */
export async function resetPassword(data: ResetPasswordData): Promise<void> {
  await pb.collection('users').confirmPasswordReset(
    data.token,
    data.password,
    data.passwordConfirm
  );
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<User | null> {
  try {
    const authData = await pb.collection('users').authRefresh();
    return authData.record as unknown as User;
  } catch (error) {
    // Token might be expired or invalid
    return null;
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return pb.authStore.model as unknown as User | null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return pb.authStore.token;
}
