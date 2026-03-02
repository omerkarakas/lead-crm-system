import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePermission } from '@/composables/usePermission';
import { Permission } from '@/types/permissions';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import PasswordResetView from '@/views/PasswordResetView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: PasswordResetView,
      meta: { public: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { requiresAuth: true, permission: Permission.MANAGE_USERS }
    }
  ]
});

// Navigation guard for protected routes
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const { canManageUsers } = usePermission();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with return URL
    next({ name: 'login', query: { redirect: to.fullPath } });
  }
  // Check if route requires specific permission
  else if (to.meta.permission === Permission.MANAGE_USERS && !canManageUsers.value) {
    // User doesn't have required permission, redirect to dashboard
    next({ name: 'dashboard' });
  }
  // Check if user is already authenticated and trying to access login
  else if (to.meta.public && authStore.isAuthenticated && to.name === 'login') {
    // Redirect to dashboard
    next({ name: 'dashboard' });
  }
  else {
    next();
  }
});

export default router;
