import pb from '@/lib/pocketbase';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  Session,
  UsersResponse,
  UsersListParams,
} from '@/types/user';

/**
 * Fetch all users with pagination and filtering
 */
export async function fetchUsers(params: UsersListParams = {}): Promise<UsersResponse> {
  const {
    page = 1,
    perPage = 50,
    search = '',
    role,
    sort = '-created',
  } = params;

  const filterParts: string[] = [];

  // Search filter (name or email)
  if (search) {
    filterParts.push(`name ~ "${search}" || email ~ "${search}"`);
  }

  // Role filter
  if (role) {
    filterParts.push(`role = "${role}"`);
  }

  const options: any = { sort };

  // Only add filter if it exists
  if (filterParts.length > 0) {
    options.filter = filterParts.join(' && ');
  }

  const response = await pb.collection('users').getList<User>(page, perPage, options);

  return {
    page: response.page,
    perPage: response.perPage,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
    items: response.items,
  };
}

/**
 * Fetch a single user by ID
 */
export async function fetchUser(id: string): Promise<User> {
  return await pb.collection('users').getOne<User>(id);
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  // PocketBase auth collection requires specific format
  const record = await pb.collection('users').create<User>({
    email: data.email,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    name: data.name,
    role: data.role,
  });

  return record;
}

/**
 * Update an existing user (Admin only)
 */
export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return await pb.collection('users').update<User>(id, data);
}

/**
 * Delete a user (Admin only, cannot delete self)
 */
export async function deleteUser(id: string): Promise<void> {
  const currentUserId = pb.authStore.model?.id;

  if (currentUserId === id) {
    throw new Error('Kendinizi silemezsiniz');
  }

  await pb.collection('users').delete(id);
}

/**
 * Fetch sessions for a user
 * Uses PocketBase API rules for access control
 */
export async function fetchSessions(userId: string): Promise<Session[]> {
  const response = await fetch(`/api/users/sessions?userId=${userId}`);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch sessions');
  }

  const data = await response.json();
  return data.items;
}

/**
 * Revoke a single session
 * Uses PocketBase API rules for access control
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions?id=${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to revoke session');
  }
}

/**
 * Revoke all sessions for a user except current
 */
export async function revokeAllOtherSessions(userId: string): Promise<void> {
  const currentToken = pb.authStore.token;

  // Get all sessions for the user
  const sessions = await fetchSessions(userId);

  // Delete all sessions except the current one
  for (const session of sessions) {
    if (session.token !== currentToken) {
      await revokeSession(session.id);
    }
  }
}
