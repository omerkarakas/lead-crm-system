/**
 * User API functions for PocketBase
 */
import pb from '@/lib/pocketbase';
import type { UserRecord } from '@/types/pocketbase';
import type { UserRole } from '@/types/pocketbase';

export interface CreateUserInput {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserInput {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string;
  passwordConfirm?: string;
  avatar?: File;
}

export interface UserListResponse {
  items: UserRecord[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

/**
 * Fetch list of all users (Admin only)
 */
export async function fetchUsers(
  page = 1,
  perPage = 50
): Promise<UserListResponse> {
  const resultList = await pb.collection('users').getList<UserRecord>(
    page,
    perPage,
    {
      sort: '-created',
      // Don't expose sensitive fields
      fields: 'id, email, name, role, avatar, created, updated'
    }
  );

  return {
    items: resultList.items,
    totalItems: resultList.totalItems,
    totalPages: resultList.totalPages,
    page: resultList.page,
    perPage: resultList.perPage
  };
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  return await pb.collection('users').create<UserRecord>(input);
}

/**
 * Update an existing user (Admin only, or users updating own profile)
 */
export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  const { id, ...data } = input;

  // Build update data dynamically based on what's provided
  const updateData: Record<string, any> = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password !== undefined) {
    updateData.password = data.password;
    updateData.passwordConfirm = data.passwordConfirm || data.password;
  }
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  return await pb.collection('users').update<UserRecord>(id, updateData);
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(id: string): Promise<void> {
  await pb.collection('users').delete(id);
}
