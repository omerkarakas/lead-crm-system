<template>
  <form @submit.prevent="handleSubmit" class="password-reset-form">
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="authStore.error" class="alert alert-error">
      {{ authStore.error }}
    </div>

    <!-- Request Mode -->
    <template v-if="mode === 'request'">
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

      <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
        <span v-if="authStore.loading">Sending...</span>
        <span v-else>Send Reset Link</span>
      </button>
    </template>

    <!-- Reset Mode -->
    <template v-else>
      <div class="form-group">
        <label for="password">New Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="Enter new password"
          :disabled="authStore.loading"
          class="form-control"
          minlength="8"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          placeholder="Confirm new password"
          :disabled="authStore.loading"
          class="form-control"
          minlength="8"
        />
      </div>

      <div v-if="passwordError" class="alert alert-error">
        {{ passwordError }}
      </div>

      <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
        <span v-if="authStore.loading">Resetting...</span>
        <span v-else>Reset Password</span>
      </button>
    </template>

    <div class="form-footer">
      <router-link to="/login" class="back-to-login">
        Back to login
      </router-link>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Mode: 'request' or 'reset'
const mode = ref<'request' | 'reset'>('request');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const passwordError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Check URL for token to determine mode
onMounted(() => {
  const token = route.query.token as string;
  if (token) {
    mode.value = 'reset';
  }
});

async function handleSubmit() {
  passwordError.value = null;
  successMessage.value = null;

  if (mode.value === 'request') {
    try {
      await authStore.requestPasswordReset(email.value);
      successMessage.value = 'Password reset link sent to your email. Please check your inbox.';
      email.value = '';
    } catch (err) {
      // Error is handled in the store
      console.error('Password reset request failed:', err);
    }
  } else {
    // Reset mode
    if (password.value !== confirmPassword.value) {
      passwordError.value = 'Passwords do not match';
      return;
    }

    if (password.value.length < 8) {
      passwordError.value = 'Password must be at least 8 characters';
      return;
    }

    const token = route.query.token as string;
    if (!token) {
      passwordError.value = 'Invalid reset token. Please request a new reset link.';
      return;
    }

    try {
      await authStore.resetPassword(token, password.value, confirmPassword.value);
      successMessage.value = 'Password reset successfully. You can now log in with your new password.';
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      // Error is handled in the store
      console.error('Password reset failed:', err);
    }
  }
}
</script>

<style scoped>
.password-reset-form {
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

.alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
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

.back-to-login {
  color: #6366f1;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-to-login:hover {
  text-decoration: underline;
}
</style>
