/**
 * Permission system types for role-based access control
 */

/**
 * User roles in the system
 */
export enum Role {
  ADMIN = 'admin',
  SALES = 'sales',
  MARKETING = 'marketing'
}

/**
 * Granular permissions for different actions
 */
export enum Permission {
  // User management
  MANAGE_USERS = 'manage_users',

  // Lead permissions
  VIEW_ALL_LEADS = 'view_all_leads',
  VIEW_OWN_LEADS = 'view_own_leads',
  CREATE_LEADS = 'create_leads',
  EDIT_LEADS = 'edit_leads',
  DELETE_LEADS = 'delete_leads',

  // System permissions
  MANAGE_TAGS = 'manage_tags',
  VIEW_REPORTS = 'view_reports'
}

/**
 * Mapping of roles to their granted permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_ALL_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.MANAGE_TAGS,
    Permission.VIEW_REPORTS
  ],
  [Role.SALES]: [
    Permission.VIEW_ALL_LEADS, // Sales can see all leads
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.VIEW_REPORTS
  ],
  [Role.MARKETING]: [
    Permission.VIEW_ALL_LEADS, // Marketing can see all leads for campaigns
    Permission.CREATE_LEADS,
    Permission.MANAGE_TAGS,
    Permission.VIEW_REPORTS
  ]
};
