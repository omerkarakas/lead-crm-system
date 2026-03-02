<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-header">
        <h1>Moka CRM</h1>
        <p>Sign in to your account</p>
      </div>

      <div class="login-body">
        <LoginForm />

        <div class="divider">
          <span>or</span>
        </div>

        <div class="oauth-buttons">
          <OAuthButton provider="google" label="Continue with Google" />
          <OAuthButton provider="github" label="Continue with GitHub" />
        </div>
      </div>

      <div class="login-footer">
        <p>
          By signing in, you agree to our
          <a href="/terms">Terms of Service</a>
          and
          <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/auth/LoginForm.vue';
import OAuthButton from '@/components/auth/OAuthButton.vue';
</script>

<style scoped>
.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.login-header p {
  font-size: 0.875rem;
  color: #6b7280;
}

.login-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 1rem;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.login-footer {
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
}

.login-footer p {
  margin: 0;
}

.login-footer a {
  color: #6366f1;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
