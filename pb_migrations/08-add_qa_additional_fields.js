/// Migration 08: Add additional fields for new question types
///
/// MANUAL SETUP REQUIRED:
///
/// Run these SQL commands on pb_data/data.db:
///   ALTER TABLE qa_questions ADD COLUMN scale_values JSON;
///   ALTER TABLE qa_questions ADD COLUMN min_length INTEGER;
///   ALTER TABLE qa_questions ADD COLUMN max_length INTEGER;
///   ALTER TABLE qa_questions ADD COLUMN max_selections INTEGER;
///
/// Then restart PocketBase and refresh schema in admin panel.

async function migrate_up({ pb, db }) {
  console.log('[Migration 08] Fields added manually via SQL');
  console.log('[Migration 08] scale_values, min_length, max_length, max_selections');
}

async function migrate_down({ pb, db }) {
  console.log('[Migration 08] Manual field removal required via SQL');
}

module.exports = { migrate_up, migrate_down };
