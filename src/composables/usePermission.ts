/**
 * Permission checking composable for role-based access control
 */
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Role, Permission, ROLE_PERMISSIONS } from '@/types/permissions';

export function usePermission() {
  const authStore = useAuthStore();

  /**
   * Check if the current user has a specific role
   */
  const hasRole = (role: Role): boolean => {
    return authStore.user?.role === role;
  };

  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!authStore.user) return false;
    const userPermissions = ROLE_PERMISSIONS[authStore.user.role as Role];
    return userPermissions?.includes(permission) ?? false;
  };

  /**
   * Computed properties for common permission checks
   */
  const canManageUsers = computed(() => hasPermission(Permission.MANAGE_USERS));
  const canViewAllLeads = computed(() => hasPermission(Permission.VIEW_ALL_LEADS));
  const canViewOwnLeads = computed(() => hasPermission(Permission.VIEW_OWN_LEADS));
  const canCreateLeads = computed(() => hasPermission(Permission.CREATE_LEADS));
  const canEditLeads = computed(() => hasPermission(Permission.EDIT_LEADS));
  const canDeleteLeads = computed(() => hasPermission(Permission.DELETE_LEADS));
  const canManageTags = computed(() => hasPermission(Permission.MANAGE_TAGS));
  const canViewReports = computed(() => hasPermission(Permission.VIEW_REPORTS));

  /**
   * Get all permissions for the current user
   */
  const userPermissions = computed(() => {
    if (!authStore.user) return [];
    return ROLE_PERMISSIONS[authStore.user.role as Role] || [];
  });

  return {
    hasRole,
    hasPermission,
    canManageUsers,
    canViewAllLeads,
    canViewOwnLeads,
    canCreateLeads,
    canEditLeads,
    canDeleteLeads,
    canManageTags,
    canViewReports,
    userPermissions
  };
}
