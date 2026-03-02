/**
 * User management store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as usersApi from '@/api/users';
import type { UserRecord } from '@/types/pocketbase';
import type { CreateUserInput, UpdateUserInput, UserListResponse } from '@/api/users';

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<UserRecord[]>([]);
  const totalItems = ref(0);
  const totalPages = ref(0);
  const currentPage = ref(1);
  const perPage = ref(50);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasMore = computed(() => currentPage.value < totalPages.value);
  const isEmpty = computed(() => users.value.length === 0 && !loading.value);

  /**
   * Fetch users with pagination
   */
  async function fetchUsers(page?: number, itemsPerPage?: number) {
    loading.value = true;
    error.value = null;

    try {
      const response: UserListResponse = await usersApi.fetchUsers(
        page || currentPage.value,
        itemsPerPage || perPage.value
      );

      users.value = response.items;
      totalItems.value = response.totalItems;
      totalPages.value = response.totalPages;
      currentPage.value = response.page;
      perPage.value = response.perPage;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load next page
   */
  async function loadNextPage() {
    if (hasMore.value && !loading.value) {
      await fetchUsers(currentPage.value + 1);
    }
  }

  /**
   * Load previous page
   */
  async function loadPrevPage() {
    if (currentPage.value > 1 && !loading.value) {
      await fetchUsers(currentPage.value - 1);
    }
  }

  /**
   * Create a new user
   */
  async function createUser(input: CreateUserInput) {
    loading.value = true;
    error.value = null;

    try {
      const newUser = await usersApi.createUser(input);
      // Add to local state
      users.value.unshift(newUser);
      totalItems.value += 1;
      return newUser;
    } catch (err: any) {
      error.value = err.message || 'Failed to create user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing user
   */
  async function updateUser(input: UpdateUserInput) {
    loading.value = true;
    error.value = null;

    try {
      const updatedUser = await usersApi.updateUser(input);
      // Update in local state
      const index = users.value.findIndex((u) => u.id === input.id);
      if (index !== -1) {
        users.value[index] = updatedUser;
      }
      return updatedUser;
    } catch (err: any) {
      error.value = err.message || 'Failed to update user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a user
   */
  async function deleteUser(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await usersApi.deleteUser(id);
      // Remove from local state
      users.value = users.value.filter((u) => u.id !== id);
      totalItems.value -= 1;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear all users (for logout)
   */
  function clearUsers() {
    users.value = [];
    totalItems.value = 0;
    totalPages.value = 0;
    currentPage.value = 1;
    error.value = null;
  }

  return {
    // State
    users,
    totalItems,
    totalPages,
    currentPage,
    perPage,
    loading,
    error,
    // Computed
    hasMore,
    isEmpty,
    // Actions
    fetchUsers,
    loadNextPage,
    loadPrevPage,
    createUser,
    updateUser,
    deleteUser,
    clearUsers
  };
});
