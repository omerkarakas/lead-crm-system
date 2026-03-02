<template>
  <div class="password-reset-view">
    <div class="password-reset-card">
      <div class="reset-header">
        <h1>{{ mode === 'request' ? 'Forgot Password?' : 'Reset Password' }}</h1>
        <p>
          {{ mode === 'request'
            ? 'Enter your email to receive a password reset link'
            : 'Enter your new password' }}
        </p>
      </div>

      <div class="reset-body">
        <PasswordResetForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PasswordResetForm from '@/components/auth/PasswordResetForm.vue';

const route = useRoute();
const mode = ref<'request' | 'reset'>('request');

onMounted(() => {
  const token = route.query.token as string;
  if (token) {
    mode.value = 'reset';
  }
});
</script>

<style scoped>
.password-reset-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
}

.password-reset-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.reset-header p {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
