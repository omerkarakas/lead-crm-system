/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const whatsappMessages = new Collection({
    id: "whatsapp_messages_collection",
    name: "whatsapp_messages",
    schema: [
      {
        id: "whatsapp_messages_lead_id",
        name: "lead_id",
        type: "relation",
        required: false,
        options: {
          collectionId: "leads_collection",
          cascadeDelete: true,
          minSelect: 0,
          maxSelect: 1
        }
      },
      {
        id: "whatsapp_messages_direction",
        name: "direction",
        type: "select",
        required: true,
        options: {
          values: ["incoming", "outgoing"],
          maxSelect: 1
        }
      },
      {
        id: "whatsapp_messages_message_text",
        name: "message_text",
        type: "text",
        required: true,
        options: {
          min: 1,
          max: 10000
        }
      },
      {
        id: "whatsapp_messages_message_type",
        name: "message_type",
        type: "select",
        required: true,
        options: {
          values: ["poll", "booking_link", "info", "error"],
          maxSelect: 1
        }
      },
      {
        id: "whatsapp_messages_status",
        name: "status",
        type: "select",
        required: true,
        options: {
          values: ["sent", "delivered", "read", "failed", "received"],
          maxSelect: 1
        }
      },
      {
        id: "whatsapp_messages_sent_at",
        name: "sent_at",
        type: "date",
        required: true
      },
      {
        id: "whatsapp_messages_green_api_id",
        name: "green_api_id",
        type: "text",
        required: false,
        options: {
          min: 1,
          max: 500
        }
      }
    ]
  });

  const whatsappMessagesIndex = new Index({
    collectionId: "whatsapp_messages_collection",
    fields: [
      {
        id: "whatsapp_messages_lead_id_idx",
        name: "lead_id",
        type: "index"
      },
      {
        id: "whatsapp_messages_sent_at_idx",
        name: "sent_at",
        type: "index"
      }
    ]
  });

  app.save(whatsappMessages);
  app.save(whatsappMessagesIndex);
}, (app) => {
  // Rollback
  app.findCollectionByNameOrId("whatsapp_messages_collection")?.delete();
});
