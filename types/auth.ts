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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  passwordConfirm: string;
}
