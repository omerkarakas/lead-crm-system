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

  const filter = filterParts.length > 0 ? filterParts.join(' && ') : undefined;

  const response = await pb.collection('users').getList<User>(page, perPage, {
    filter,
    sort,
  });

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
  const { passwordConfirm, ...userData } = data;

  // Create user via PocketBase
  const record = await pb.collection('users').create<User>({
    ...userData,
    passwordConfirm,
    password: data.password,
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
 * Fetch sessions for a user (Admin or own sessions)
 */
export async function fetchSessions(userId: string): Promise<Session[]> {
  const currentUserId = pb.authStore.model?.id;
  const currentUserRole = pb.authStore.model?.role;

  // Check permissions: Admin can see all sessions, users can only see their own
  if (currentUserRole !== 'admin' && currentUserId !== userId) {
    throw new Error('Bu oturumları görüntüleme yetkiniz yok');
  }

  const response = await pb.collection('sessions').getList<Session>(1, 50, {
    filter: `userId = "${userId}"`,
    sort: '-lastActive',
  });

  return response.items;
}

/**
 * Revoke a single session (Admin or own session)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const currentUserId = pb.authStore.model?.id;
  const currentUserRole = pb.authStore.model?.role;

  // Get the session first to check ownership
  const session = await pb.collection('sessions').getOne<Session>(sessionId);

  // Admin can revoke any session, users can only revoke their own
  if (currentUserRole !== 'admin' && session.userId !== currentUserId) {
    throw new Error('Bu oturumu iptal etme yetkiniz yok');
  }

  await pb.collection('sessions').delete(sessionId);
}

/**
 * Revoke all sessions for a user except current
 */
export async function revokeAllOtherSessions(userId: string): Promise<void> {
  const currentUserId = pb.authStore.model?.id;
  const currentUserRole = pb.authStore.model?.role;
  const currentToken = pb.authStore.token;

  // Check permissions
  if (currentUserRole !== 'admin' && currentUserId !== userId) {
    throw new Error('Bu oturumları iptal etme yetkiniz yok');
  }

  // Get all sessions for the user
  const sessions = await fetchSessions(userId);

  // Delete all sessions except the current one
  for (const session of sessions) {
    if (session.token !== currentToken) {
      await pb.collection('sessions').delete(session.id);
    }
  }
}
