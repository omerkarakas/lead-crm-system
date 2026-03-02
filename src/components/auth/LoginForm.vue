<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <div v-if="authStore.error" class="alert alert-error">
      {{ authStore.error }}
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        placeholder="you@example.com"
        :disabled="authStore.loading"
        class="form-control"
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <div class="password-input-wrapper">
        <input
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          required
          placeholder="Enter your password"
          :disabled="authStore.loading"
          class="form-control"
        />
        <button
          type="button"
          @click="showPassword = !showPassword"
          class="toggle-password"
          :disabled="authStore.loading"
        >
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>
    </div>

    <div class="form-group checkbox-group">
      <label class="checkbox-label">
        <input v-model="rememberMe" type="checkbox" :disabled="authStore.loading" />
        <span>Remember me</span>
      </label>
    </div>

    <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
      <span v-if="authStore.loading">Logging in...</span>
      <span v-else>Log in</span>
    </button>

    <div class="form-footer">
      <router-link to="/reset-password" class="forgot-password-link">
        Forgot password?
      </router-link>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

async function handleSubmit() {
  try {
    await authStore.login(email.value, password.value);
    // Redirect to dashboard after successful login
    router.push('/dashboard');
  } catch (err) {
    // Error is handled in the store and displayed in the UI
    console.error('Login failed:', err);
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 400px;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.alert-error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-control:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-control {
  padding-right: 4rem;
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: #6366f1;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.toggle-password:hover:not(:disabled) {
  color: #4f46e5;
}

.toggle-password:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4f46e5;
}

.btn-primary:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.form-footer {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.forgot-password-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 0.875rem;
}

.forgot-password-link:hover {
  text-decoration: underline;
}
</style>
