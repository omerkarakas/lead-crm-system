const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'pb_data', 'data.db');
const db = new Database(dbPath);

try {
  // Get email_templates collection
  const collection = db.prepare('SELECT * FROM _collections WHERE name = ?').get('email_templates');

  if (!collection) {
    console.log('❌ email_templates collection not found!');
    process.exit(1);
  }

  const collectionId = collection.id;
  const now = new Date().toISOString();

  // Sample templates
  const templates = [
    {
      id: 'template_welcome',
      name: 'Hoş Geldin',
      subject: '{{name}} ile tanışalım!',
      body: '<p>Merhaba {{name}},</p><p>Şirketiniz {{company}} ile tanışmaktan mutluluk duyuyoruz.</p><p>Size en iyi şekilde yardımcı olmak için buradayız.</p><p>Saygılarımla,</p><p>Moka CRM Ekibi</p>',
      category: 'welcome',
      is_active: true,
      is_deleted: false
    },
    {
      id: 'template_followup',
      name: 'Takip - 1 Gün',
      subject: '{{name}} beyinizi aldık mı?',
      body: '<p>Merhaba {{name}},</p><p>Geçen gün {{website}} web sitemizden bize ulaştınız.</p><p>Sorularınız için yardımcı olabilir miyim?</p><p>İyi çalışmalar,</p><p>Moka CRM</p>',
      category: 'follow_up',
      is_active: true,
      is_deleted: false
    },
    {
      id: 'template_qualification',
      name: 'Qualification',
      subject: '{{name}} için değerlendirme',
      body: '<p>Merhaba {{name}},</p><p>Aşağıdaki bilgilerinizle ilgileniyoruz:</p><ul><li>Şirket: {{company}}</li><li>Web: {{website}}</li><li>Mesajınız: {{message}}</li></ul><p>Size en kısa sürede dönüş yapacağız.</p>',
      category: 'qualification',
      is_active: true,
      is_deleted: false
    },
    {
      id: 'template_generic',
      name: 'Genel Bilgi',
      subject: '{{name}} merhaba',
      body: '<p>Merhaba {{name}},</p><p>Bu bir test e-postasıdır.</p><p>Gösterdiğiniz ilgi için teşekkürler.</p>',
      category: 'generic',
      is_active: true,
      is_deleted: false
    }
  ];

  let inserted = 0;
  for (const template of templates) {
    // Generate ID if not provided
    const id = template.id || Math.random().toString(36).substring(2, 10);

    // Insert into email_templates table
    const stmt = db.prepare(`
      INSERT INTO email_templates (id, name, subject, body, category, is_active, is_deleted, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        template.name,
        template.subject,
        template.body,
        template.category,
        template.is_active ? 1 : 0,
        template.is_deleted ? 1 : 0,
        now,
        now
      );
      inserted++;
      console.log(`✅ Created: ${template.name} (${template.category})`);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        console.log(`⚠️  Already exists: ${template.name}`);
      } else {
        console.log(`❌ Error creating ${template.name}:`, err.message);
      }
    }
  }

  console.log(`\n📊 Summary: ${inserted} templates created`);

  // Show all templates
  const allTemplates = db.prepare('SELECT name, category, is_active FROM email_templates WHERE is_deleted = 0').all();
  console.log('\n📋 Active templates:');
  allTemplates.forEach(t => {
    const status = t.is_active ? '✅' : '⏸️ ';
    console.log(`   ${status} ${t.name} (${t.category})`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
