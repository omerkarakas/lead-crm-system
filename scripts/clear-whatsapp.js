import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Login as admin
await pb.collection('users').authWithPassword('admin@mokacrm.com', 'admin123', {
  email: 'admin@mokacrm.com',
  password: 'admin123',
});

async function clearWhatsAppMessages() {
  try {
    let page = 1;
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      const result = await pb.collection('whatsapp_messages').getList(page, 100);

      for (const item of result.items) {
        await pb.collection('whatsapp_messages').delete(item.id);
        totalDeleted++;
      }

      hasMore = result.items.length === 100;
      page++;
    }

    console.log(`Deleted ${totalDeleted} WhatsApp messages`);
  } catch (error) {
    console.error('Error:', error);
  }
}

clearWhatsAppMessages();
