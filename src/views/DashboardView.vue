<template>
  <div class="dashboard-view">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Moka CRM</h1>
        <div class="user-section">
          <span class="user-name">Welcome, {{ authStore.user?.name }}!</span>
          <span class="role-badge" :class="`role-${authStore.user?.role}`">
            {{ roleLabel }}
          </span>
          <button @click="handleLogout" class="logout-btn">Log out</button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome to Moka CRM! Your foundation is set up and ready.</p>

        <div class="info-section">
          <h3>Your Profile</h3>
          <ul>
            <li><strong>Name:</strong> {{ authStore.user?.name }}</li>
            <li><strong>Email:</strong> {{ authStore.user?.email }}</li>
            <li><strong>Role:</strong> {{ roleLabel }}</li>
          </ul>
        </div>

        <div class="info-section">
          <h3>Authentication Status</h3>
          <p class="status-success">
            ✓ You are logged in with persistent session
          </p>
          <p class="info-text">
            Your session will persist across browser refreshes using PocketBase authStore.
          </p>
        </div>

        <div class="info-section">
          <h3>Next Steps</h3>
          <ul>
            <li>Lead management features coming in Phase 1, Plan 2</li>
            <li>Dashboard widgets and analytics coming later</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const roleLabel = computed(() => {
  const role = authStore.user?.role;
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'sales':
      return 'Sales';
    case 'marketing':
      return 'Marketing';
    default:
      return 'User';
  }
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background-color: #f9fafb;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-size: 0.875rem;
  color: #374151;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-admin {
  background-color: #fee2e2;
  color: #991b1b;
}

.role-sales {
  background-color: #dbeafe;
  color: #1e40af;
}

.role-marketing {
  background-color: #d1fae5;
  color: #065f46;
}

.logout-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.dashboard-main {
  padding: 2rem;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-content h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.info-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
}

.info-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 1rem;
}

.info-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-section li {
  padding: 0.5rem 0;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.info-section li:last-child {
  border-bottom: none;
}

.status-success {
  color: #059669;
  font-weight: 500;
  margin: 0.5rem 0;
}

.info-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.5rem 0;
}
</style>
