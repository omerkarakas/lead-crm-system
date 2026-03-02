<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ mode === 'create' ? 'Add New User' : 'Edit User' }}</h2>
        <button @click="$emit('close')" class="btn-close">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Error Display -->
        <div v-if="error" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Name Field -->
        <div class="form-group">
          <label for="name">Name *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter user's full name"
            :disabled="loading"
          />
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="user@example.com"
            :disabled="loading"
          />
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password">
            Password {{ mode === 'edit' ? '(leave empty to keep current)' : '*' }}
          </label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            :required="mode === 'create'"
            :placeholder="mode === 'create' ? 'Enter password (min 8 characters)' : 'Leave empty to keep current'"
            :disabled="loading"
            minlength="8"
          />
          <span class="field-hint">Must be at least 8 characters long</span>
        </div>

        <!-- Role Field -->
        <div class="form-group">
          <label for="role">Role *</label>
          <select id="role" v-model="formData.role" required :disabled="loading">
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary" :disabled="loading">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading || !isFormValid">
            {{ loading ? 'Saving...' : (mode === 'create' ? 'Create User' : 'Save Changes') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useUsersStore } from '@/stores/users';
import type { UserRecord, UserRole } from '@/types/pocketbase';

interface Props {
  mode: 'create' | 'edit';
  user?: UserRecord | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const usersStore = useUsersStore();

const loading = usersStore.loading;
const error = ref<string | null>(null);

const formData = reactive({
  name: '',
  email: '',
  password: '',
  role: '' as UserRole | ''
});

// Watch for user prop changes to populate form in edit mode
watch(() => props.user, (user) => {
  if (user && props.mode === 'edit') {
    formData.name = user.name;
    formData.email = user.email;
    formData.password = '';
    formData.role = user.role;
  } else {
    resetForm();
  }
}, { immediate: true });

const isFormValid = computed(() => {
  if (!formData.name || !formData.email || !formData.role) return false;
  if (props.mode === 'create' && !formData.password) return false;
  if (formData.password && formData.password.length < 8) return false;
  return true;
});

function resetForm() {
  formData.name = '';
  formData.email = '';
  formData.password = '';
  formData.role = '' as UserRole | '';
}

async function handleSubmit() {
  error.value = null;

  try {
    if (props.mode === 'create') {
      await usersStore.createUser({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.password,
        name: formData.name,
        role: formData.role as UserRole
      });
    } else if (props.user) {
      const updateData: any = {
        id: props.user.id,
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.passwordConfirm = formData.password;
      }

      await usersStore.updateUser(updateData);
    }

    // Emit saved event to parent
    emit('saved');
  } catch (err: any) {
    error.value = err.message || 'An error occurred while saving the user';
  }
}
</script>

<style scoped>
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
  width: 100%;
  max-width: 500px;
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
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

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-secondary {
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}
</style>
