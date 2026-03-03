import { Role } from '@/types/user';

export const PERMISSIONS = {
  // User management
  CAN_MANAGE_USERS: 'can_manage_users',

  // Lead management
  CAN_CREATE_LEADS: 'can_create_leads',
  CAN_EDIT_LEADS: 'can_edit_leads',
  CAN_DELETE_LEADS: 'can_delete_leads',
  CAN_VIEW_ALL_LEADS: 'can_view_all_leads',

  // Notes and tags
  CAN_ADD_NOTES: 'can_add_notes',
  CAN_MANAGE_TAGS: 'can_manage_tags',

  // QA management
  CAN_MANAGE_QA_QUESTIONS: 'can_manage_qa_questions',
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    PERMISSIONS.CAN_MANAGE_USERS,
    PERMISSIONS.CAN_CREATE_LEADS,
    PERMISSIONS.CAN_EDIT_LEADS,
    PERMISSIONS.CAN_DELETE_LEADS,
    PERMISSIONS.CAN_VIEW_ALL_LEADS,
    PERMISSIONS.CAN_ADD_NOTES,
    PERMISSIONS.CAN_MANAGE_TAGS,
    PERMISSIONS.CAN_MANAGE_QA_QUESTIONS,
  ],
  [Role.SALES]: [
    PERMISSIONS.CAN_CREATE_LEADS,
    PERMISSIONS.CAN_EDIT_LEADS,
    PERMISSIONS.CAN_VIEW_ALL_LEADS,
    PERMISSIONS.CAN_ADD_NOTES,
    PERMISSIONS.CAN_MANAGE_TAGS,
  ],
  [Role.MARKETING]: [
    PERMISSIONS.CAN_CREATE_LEADS,
    PERMISSIONS.CAN_VIEW_ALL_LEADS,
    PERMISSIONS.CAN_ADD_NOTES,
    PERMISSIONS.CAN_MANAGE_TAGS,
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_MANAGE_USERS);
}

export function canCreateLeads(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_CREATE_LEADS);
}

export function canEditLeads(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_EDIT_LEADS);
}

export function canDeleteLeads(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_DELETE_LEADS);
}

export function canViewAllLeads(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_VIEW_ALL_LEADS);
}

export function canAddNotes(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_ADD_NOTES);
}

export function canManageTags(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_MANAGE_TAGS);
}

export function canManageQAQuestions(role: Role): boolean {
  return hasPermission(role, PERMISSIONS.CAN_MANAGE_QA_QUESTIONS);
}
