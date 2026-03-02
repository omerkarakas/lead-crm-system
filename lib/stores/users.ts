import { create } from 'zustand';
import { User, CreateUserDto, UpdateUserDto, UsersListParams } from '@/types/user';
import * as usersApi from '@/lib/api/users';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
  };

  fetchUsers: (params?: UsersListParams) => Promise<void>;
  fetchUser: (id: string) => Promise<User>;
  createUser: (data: CreateUserDto) => Promise<void>;
  updateUser: (id: string, data: UpdateUserDto) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    perPage: 50,
    totalPages: 1,
    totalItems: 0,
  },

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await usersApi.fetchUsers(params);
      set({
        users: response.items,
        pagination: {
          page: response.page,
          perPage: response.perPage,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Kullanıcılar yüklenirken hata oluştu', loading: false });
    }
  },

  fetchUser: async (id: string) => {
    return await usersApi.fetchUser(id);
  },

  createUser: async (data: CreateUserDto) => {
    set({ loading: true, error: null });
    try {
      await usersApi.createUser(data);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kullanıcı oluşturulurken hata oluştu', loading: false });
      throw error;
    }
  },

  updateUser: async (id: string, data: UpdateUserDto) => {
    set({ loading: true, error: null });
    try {
      await usersApi.updateUser(id, data);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kullanıcı güncellenirken hata oluştu', loading: false });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await usersApi.deleteUser(id);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kullanıcı silinirken hata oluştu', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
