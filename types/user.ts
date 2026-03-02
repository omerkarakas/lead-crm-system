export enum Role {
  ADMIN = 'admin',
  SALES = 'sales',
  MARKETING = 'marketing'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  created: string;
  updated: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: Role;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: Role;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  deviceId: string;
  deviceName?: string;
  userAgent: string;
  ip: string;
  lastActive: string;
  created: string;
  expand?: {
    userId?: User;
  };
}

export interface UsersResponse {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: User[];
}

export interface UsersListParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: Role;
  sort?: string;
}
