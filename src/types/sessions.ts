/**
 * Session types for device/session management
 */
import type { BaseRecord } from './pocketbase';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface SessionRecord extends BaseRecord {
  collectionId: string;
  collectionName: 'sessions';
  userId: string;
  deviceName: string;
  deviceType: DeviceType;
  ipAddress?: string;
  userAgent?: string;
  // Expanded relations (if using expand)
  expand?: {
    user?: import('./pocketbase').UserRecord;
  };
}
