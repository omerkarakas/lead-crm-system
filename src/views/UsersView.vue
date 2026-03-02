<template>
  <div class="users-view">
    <div class="page-header">
      <div class="breadcrumb">
        <router-link to="/dashboard">Dashboard</router-link>
        <span class="separator">/</span>
        <span class="current">User Management</span>
      </div>
      <h1>User Management</h1>
    </div>

    <!-- Access Denied Message -->
    <div v-if="!canManageUsers" class="access-denied">
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <h3>Access Denied</h3>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    </div>

    <!-- User Management Content -->
    <div v-else class="users-content">
      <div class="actions-bar">
        <button @click="showCreateForm = true" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add User
        </button>
        <button @click="refreshUsers" class="btn btn-secondary" :disabled="usersStore.loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </button>
      </div>

      <UserList
        @edit="openEditForm"
        @delete="confirmDelete"
      />

      <!-- Create/Edit Form Modal -->
      <UserForm
        v-if="showCreateForm || showEditForm"
        :mode="showEditForm ? 'edit' : 'create'"
        :user="selectedUser"
        @close="closeForm"
        @saved="onUserSaved"
      />

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button @click="cancelDelete" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete <strong>{{ userToDelete?.name }}</strong>?</p>
            <p class="text-muted">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button @click="cancelDelete" class="btn btn-secondary">Cancel</button>
            <button @click="executeDelete" class="btn btn-danger" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePermission } from '@/composables/usePermission';
import { useUsersStore } from '@/stores/users';
import type { UserRecord } from '@/types/pocketbase';
import UserList from '@/components/users/UserList.vue';
import UserForm from '@/components/users/UserForm.vue';

const { canManageUsers } = usePermission();
const usersStore = useUsersStore();

// UI State
const showCreateForm = ref(false);
const showEditForm = ref(false);
const showDeleteConfirm = ref(false);
const selectedUser = ref<UserRecord | null>(null);
const userToDelete = ref<UserRecord | null>(null);
const deleting = ref(false);

// Load users on mount
onMounted(() => {
  if (canManageUsers.value) {
    refreshUsers();
  }
});

function refreshUsers() {
  usersStore.fetchUsers(1);
}

function openEditForm(user: UserRecord) {
  selectedUser.value = user;
  showEditForm.value = true;
}

function closeForm() {
  showCreateForm.value = false;
  showEditForm.value = false;
  selectedUser.value = null;
}

function onUserSaved() {
  closeForm();
  refreshUsers();
}

function confirmDelete(user: UserRecord) {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  userToDelete.value = null;
}

async function executeDelete() {
  if (!userToDelete.value) return;

  deleting.value = true;
  try {
    await usersStore.deleteUser(userToDelete.value.id);
    showDeleteConfirm.value = false;
    userToDelete.value = null;
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    // Could show a toast notification here
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.users-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.breadcrumb a {
  color: #6b7280;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: #3b82f6;
}

.breadcrumb .separator {
  color: #d1d5db;
}

.breadcrumb .current {
  color: #1f2937;
  font-weight: 500;
}

h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.access-denied {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.alert {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  max-width: 500px;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert svg {
  flex-shrink: 0;
}

.alert h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.alert p {
  margin: 0;
  font-size: 0.875rem;
}

.actions-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm {
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #4b5563;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 0.75rem 0;
  color: #374151;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}
</style>
