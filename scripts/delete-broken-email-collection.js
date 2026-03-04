const Database = require('better-sqlite3');
const path = require('path');

// Use process.cwd() to get the correct working directory
const dbPath = path.join(process.cwd(), 'pb_data', 'data.db');
const db = new Database(dbPath);

try {
  // PocketBase uses _collections table
  const collection = db.prepare('SELECT * FROM _collections WHERE name = ?').get('email_messages');

  if (collection) {
    const collectionId = collection.id;

    // Delete collection fields from _collectionFields
    db.prepare('DELETE FROM _collectionFields WHERE collectionId = ?').run(collectionId);

    // Delete collection from _collections
    db.prepare('DELETE FROM _collections WHERE id = ?').run(collectionId);

    // Drop the actual table
    db.prepare('DROP TABLE IF EXISTS email_messages').run();

    console.log('✅ email_messages collection deleted successfully!');
  } else {
    // Just in case, try to drop the table directly
    db.prepare('DROP TABLE IF EXISTS email_messages').run();
    console.log('ℹ️  email_messages dropped (collection record not found)');
  }

  // List all remaining tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_%' ORDER BY name").all();
  console.log('\n📋 Remaining tables:', tables.map(t => t.name).join(', '));

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
