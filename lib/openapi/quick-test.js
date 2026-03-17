#!/usr/bin/env node

/**
 * Moka CRM API - Quick Test Script
 * Usage: node quick-test.js <email> <password>
 */

const http = require('http');

const EMAIL = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!EMAIL || !PASSWORD) {
  console.log('❌ Kullanım: node quick-test.js <email> <password>');
  console.log('');
  console.log('Örnek:');
  console.log('  node quick-test.js admin@example.com mypassword');
  process.exit(1);
}

const PB_URL = '127.0.0.1';
const PB_PORT = 8090;
const API_URL = 'localhost';
const API_PORT = 3000;

// Helper: HTTP POST
function postJSON(host, port, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper: HTTP GET
function getJSON(host, port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== Moka CRM API Test ===\n');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Password: ***\n`);

  // Step 1: Login
  console.log('⏳ Login oluyor...');
  const loginResponse = await postJSON(PB_URL, PB_PORT, '/api/collections/users/auth-with-password', {
    identity: EMAIL,
    password: PASSWORD
  });

  if (loginResponse.status !== 200) {
    console.log('❌ Login başarısız!');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    process.exit(1);
  }

  const token = loginResponse.data.token;
  console.log('✅ Login başarılı!');
  console.log(`🔑 Token: ${token.substring(0, 30)}...\n`);

  // Step 2: Create Lead
  console.log('⏳ Yeni lead oluşturuluyor...');
  const createResponse = await postJSON(API_URL, API_PORT, '/api/leads', {
    name: 'API Test Lead',
    email: `test-${Date.now()}@example.com`,
    phone: '+905551234567',
    source: 'manual',
    company: 'Test Company',
    message: 'API testinden oluşturuldu'
  }, {
    'Authorization': `Bearer ${token}`
  });

  if (createResponse.status !== 201) {
    console.log('❌ Lead oluşturma başarısız!');
    console.log(JSON.stringify(createResponse.data, null, 2));
    process.exit(1);
  }

  console.log('✅ Lead oluşturuldu!');
  console.log(JSON.stringify(createResponse.data, null, 2));
  console.log('');

  // Step 3: Get Leads
  console.log('⏳ Lead listesi alınıyor...');
  const listResponse = await getJSON(API_URL, API_PORT, '/api/leads?page=1&perPage=5', {
    'Authorization': `Bearer ${token}`
  });

  if (listResponse.status !== 200) {
    console.log('❌ Lead listesi alınamadı!');
    process.exit(1);
  }

  console.log('✅ Lead listesi alındı!');
  console.log(`📊 Toplam lead: ${listResponse.data.totalItems}`);
  console.log('');

  console.log('=== Test Başarıyla Tamamlandı ===');
  console.log('');
  console.log('💡 Bu token\'ı Scalar\'da kullanabilirsiniz:');
  console.log(`   ${token}`);
}

main().catch(console.error);
