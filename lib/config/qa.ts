/**
 * QA Configuration - Server-side functions
 * This file contains server-only functions that use PocketBase
 */

import PocketBase from 'pocketbase';
import { getServerPb } from '../pocketbase/server';
import { QA_CONFIG } from './qa-constants';

// In-memory cache for booking link to avoid repeated database queries
let cachedBookingLink: string | null = null;

/**
 * Get booking link for qualified leads from database
 */
export async function getBookingLink(pb?: PocketBase): Promise<string> {
  // Return cached value if available
  if (cachedBookingLink) {
    return cachedBookingLink;
  }

  try {
    const pocketbase = pb || await getServerPb();

    // Query for booking_link_url setting
    const result = await pocketbase.collection('app_settings').getList(1, 1, {
      filter: `service_name = "calcom" && setting_key = "booking_link_url" && is_active = true`
    });

    if (result.totalItems > 0 && result.items[0]) {
      const link = result.items[0].setting_value;
      // Cache the result
      cachedBookingLink = link;
      return link;
    }

    // Fallback to default if not found in database
    return QA_CONFIG.defaultBookingLink;
  } catch (error) {
    console.error('Error fetching booking link from database:', error);
    // Return fallback on error
    return QA_CONFIG.defaultBookingLink;
  }
}

/**
 * Clear the cached booking link (useful after updating the setting)
 */
export function clearBookingLinkCache(): void {
  cachedBookingLink = null;
}

// Re-export constants and utility functions for convenience
export { QA_CONFIG, formatWelcomeMessage, formatPollMessage, calculateScore, isQualified } from './qa-constants';


