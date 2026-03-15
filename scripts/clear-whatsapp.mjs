// Simple script to delete all WhatsApp messages
// Run with: node --no-warnings clear-whatsapp.mjs

const PB_URL = 'http://127.0.0.1:8090';

async function deleteAllMessages() {
  let page = 1;
  let totalDeleted = 0;

  try {
    // First, get all messages
    while (true) {
      const response = await fetch(`${PB_URL}/api/collections/whatsapp_messages/records?page=${page}&perPage=100`);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        break;
      }

      // Delete each message
      for (const item of data.items) {
        await fetch(`${PB_URL}/api/collections/whatsapp_messages/records/${item.id}`, {
          method: 'DELETE'
        });
        totalDeleted++;
      }

      if (data.items.length < 100) {
        break;
      }
      page++;
    }

    console.log(`✓ Deleted ${totalDeleted} WhatsApp messages`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteAllMessages();
