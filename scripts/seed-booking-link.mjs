/**
 * Seed script to add booking_link_url setting to app_settings
 * Usage: node scripts/seed-booking-link.mjs
 */

import PocketBase from 'pocketbase';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env.local file
try {
  const envContent = readFileSync(join(rootDir, '.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=');
    }
  });
} catch (e) {
  console.warn('No .env.local file found, trying .env');
  try {
    const envContent = readFileSync(join(rootDir, '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    });
  } catch (e2) {
    console.warn('No .env file found either, using defaults');
  }
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin';

const pb = new PocketBase(PB_URL);

async function seedBookingLink() {
  try {
    console.log('Connecting to PocketBase at', PB_URL);

    // Authenticate as admin
    try {
      await pb.collection('users').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('Authenticated as admin');
    } catch (error) {
      console.error('Admin authentication failed. Please check your credentials.');
      console.error('Expected: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env');
      throw error;
    }

    // Check if setting already exists
    const existing = await pb.collection('app_settings').getList(1, 1, {
      filter: `service_name = "calcom" && setting_key = "booking_link_url"`
    });

    if (existing.totalItems > 0) {
      console.log('booking_link_url setting already exists with ID:', existing.items[0].id);

      // Update it to ensure correct value
      const updated = await pb.collection('app_settings').update(existing.items[0].id, {
        setting_value: 'https://cal.mokadijital.com/moka/30min',
        description: 'Randevu booking link for qualified leads',
        is_active: true
      });
      console.log('Updated booking_link_url setting:', updated.id);
      return;
    }

    // Create the setting
    const record = await pb.collection('app_settings').create({
      service_name: 'calcom',
      setting_key: 'booking_link_url',
      setting_value: 'https://cal.mokadijital.com/moka/30min',
      description: 'Randevu booking link for qualified leads',
      is_active: true
    });

    console.log('Created booking_link_url setting with ID:', record.id);
  } catch (error) {
    console.error('Error seeding booking_link_url:', error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  } finally {
    pb.authStore.clear();
  }
}

seedBookingLink();
