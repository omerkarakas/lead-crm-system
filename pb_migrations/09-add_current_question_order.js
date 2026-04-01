/// Migration 09: Add current_question_order field to leads
///
/// MANUAL SETUP REQUIRED:
///
/// Run this SQL command on pb_data/data.db:
///   ALTER TABLE leads ADD COLUMN current_question_order INTEGER DEFAULT 0;
///
/// Then restart PocketBase and refresh schema in admin panel.

async function migrate_up({ pb, db }) {
  console.log('[Migration 09] Added current_question_order field manually via SQL');
}

async function migrate_down({ pb, db }) {
  console.log('[Migration 09] Manual field removal required via SQL');
}

module.exports = { migrate_up, migrate_down };
