/**
 * Fix: Add proposal_notifications to app_settings service_name field
 *
 * Run this script with: node scripts/fix-proposal-notifications-setting.js
 *
 * This script directly updates the PocketBase collection schema to add
 * proposal_notifications as a valid service_name value.
 */

const fs = require('fs');
const path = require('path');

// Read the current migration file
const migrationFile = path.join(__dirname, '../pb_migrations/1772695621_created_app_settings.js');
let content = fs.readFileSync(migrationFile, 'utf8');

// Update the service_name values to include proposal_notifications
const oldValues = `"values": [
          "green_api",
          "calcom",
          "resend"
        ]`;

const newValues = `"values": [
          "green_api",
          "calcom",
          "resend",
          "proposal_notifications"
        ]`;

content = content.replace(oldValues, newValues);

// Write back the updated migration
fs.writeFileSync(migrationFile, content, 'utf8');

console.log('✅ Updated migration file to include proposal_notifications');
console.log('');
console.log('⚠️  IMPORTANT: You need to either:');
console.log('   1. Restart PocketBase server', '');
console.log('   2. OR manually update in PocketBase Admin UI:');
console.log('      - Go to Settings > Collections > app_settings');
console.log('      - Edit the service_name field');
console.log('      - Add "proposal_notifications" to the select values');
