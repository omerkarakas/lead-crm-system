const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(process.cwd(), 'pb_data', 'data.db');
const db = new Database(dbPath);

try {
  console.log('🔧 Sessions collection oluşturuluyor...\n');

  const now = new Date().toISOString();

  // Generate unique IDs for fields
  const generateId = () => crypto.randomBytes(15).toString('hex').substring(0, 15);

  // Define the fields
  const fields = [
    {
      id: generateId(),
      name: 'userId',
      type: 'text',
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      id: generateId(),
      name: 'token',
      type: 'text',
      system: false,
      required: true,
      unique: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      id: generateId(),
      name: 'lastActive',
      type: 'date',
      system: false,
      required: true,
      unique: false,
      options: {}
    },
    {
      id: generateId(),
      name: 'ipAddress',
      type: 'text',
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      id: generateId(),
      name: 'userAgent',
      type: 'text',
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    }
  ];

  // Define the indexes
  const indexes = [
    'CREATE UNIQUE INDEX `_sessions_token_idx` ON `sessions` (`token`)',
    'CREATE INDEX `_sessions_userId_idx` ON `sessions` (`userId`)'
  ];

  // Create the collection
  const insertCollection = db.prepare(`
    INSERT INTO _collections (system, type, name, fields, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCollection.run(
    0,  // system
    'base',  // type
    'sessions',  // name
    JSON.stringify(fields),  // fields
    JSON.stringify(indexes),  // indexes
    null,  // listRule - no access by default
    null,  // viewRule - no access by default
    null,  // createRule - no access by default
    null,  // updateRule - no access by default
    null,  // deleteRule - no access by default
    '{}',  // options
    now,
    now
  );

  console.log('✅ Sessions collection oluşturuldu!');
  console.log('');
  console.log('📋 Collection detayları:');
  console.log('   - Name: sessions');
  console.log('   - Type: base');
  console.log('');
  console.log('📝 Alanlar:');
  console.log('   - userId (text, required, indexed)');
  console.log('   - token (text, required, unique, indexed)');
  console.log('   - lastActive (date, required)');
  console.log('   - ipAddress (text, optional)');
  console.log('   - userAgent (text, optional)');
  console.log('');
  console.log('🔒 API Kuralları:');
  console.log('   - Varsayılan olarak herkese kapalı');
  console.log('   - Sadece admin kullanıcıları erişebilir (PocketBase otomatik yönetir)');
  console.log('');
  console.log('');
  console.log('⚠️  ÖNEMLİ: Lütfen aşağıdaki adımları sırasıyla yapın:');
  console.log('');
  console.log('   1. PocketBase uygulamasını DURDURUN (Ctrl+C veya terminalde kapatın)');
  console.log('   2. Tekrar başlatın: ./pocketbase serve');
  console.log('   3. Admin paneline gidin: http://127.0.0.1:8090/_/');
  console.log('   4. Settings > Collections > sessions');
  console.log('   5. API Rules kısmını kontrol edin (admin için açık olmalı)');
  console.log('');

} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    console.log('⚠️  Sessions collection zaten mevcut!');
  } else {
    console.error('❌ Hata:', error.message);
  }
} finally {
  db.close();
}
