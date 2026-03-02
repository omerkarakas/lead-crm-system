/**
 * PocketBase type definitions for Moka CRM collections
 */

// Base response type with id and created/updated timestamps
export type BaseRecord = {
  id: string;
  created: string;
  updated: string;
};

// User roles
export type UserRole = 'admin' | 'sales' | 'marketing';

// User record type
export type UserRecord = BaseRecord & {
  collectionId: '_pb_users_auth_';
  collectionName: 'users';
  username: string;
  verified: boolean;
  emailVisibility: boolean;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
};

// Lead source types
export type LeadSource = 'web_form' | 'api' | 'manual' | 'whatsapp';

// Lead status types
export type LeadStatus = 'new' | 'qualified' | 'booked' | 'customer' | 'lost';

// Lead quality types
export type LeadQuality = 'pending' | 'qualified';

// Lead record type
export type LeadRecord = BaseRecord & {
  collectionId: 'leads_collection';
  collectionName: 'leads';
  name: string;
  phone: string;
  email?: string;
  company?: string;
  website?: string;
  message?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  quality: LeadQuality;
  tags?: string[];
  createdBy?: string;
};

// Note record type
export type NoteRecord = BaseRecord & {
  collectionId: 'notes_collection';
  collectionName: 'notes';
  leadId: string;
  userId: string;
  content: string;
  // Expanded relations (if using expand)
  expand?: {
    lead?: LeadRecord;
    user?: UserRecord;
  };
};

// Tag record type
export type TagRecord = BaseRecord & {
  collectionId: 'tags_collection';
  collectionName: 'tags';
  name: string;
  color?: string;
};

// Auth response type
export type AuthResponse = {
  token: string;
  record: UserRecord;
};

// OAuth provider types
export type OAuthProvider = 'google' | 'github';
