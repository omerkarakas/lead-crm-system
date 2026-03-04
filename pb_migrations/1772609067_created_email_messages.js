/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const emailMessagesCollection = new Collection({
    id: "email_messages_collection",
    name: "email_messages",
    type: "base",
    schema: [
      {
        id: "email_messages_lead_id",
        name: "lead_id",
        type: "relation",
        required: true,
        options: {
          collectionId: "leads_collection",
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        id: "email_messages_to_email",
        name: "to_email",
        type: "email",
        required: true,
        options: {}
      },
      {
        id: "email_messages_subject",
        name: "subject",
        type: "text",
        required: true,
        options: {
          min: 1,
          max: 500
        }
      },
      {
        id: "email_messages_body",
        name: "body",
        type: "text",
        required: true,
        options: {
          min: 1,
          max: 50000
        }
      },
      {
        id: "email_messages_template_id",
        name: "template_id",
        type: "text",
        required: false,
        options: {
          min: 1,
          max: 100
        }
      },
      {
        id: "email_messages_direction",
        name: "direction",
        type: "select",
        required: true,
        options: {
          values: ["incoming", "outgoing"],
          maxSelect: 1
        },
        default: "outgoing"
      },
      {
        id: "email_messages_status",
        name: "status",
        type: "select",
        required: true,
        options: {
          values: ["pending", "sent", "delivered", "failed"],
          maxSelect: 1
        },
        default: "pending"
      },
      {
        id: "email_messages_sent_at",
        name: "sent_at",
        type: "date",
        required: false
      },
      {
        id: "email_messages_resend_message_id",
        name: "resend_message_id",
        type: "text",
        required: false,
        options: {
          min: 1,
          max: 500
        }
      }
    ]
  });

  const emailMessagesCollectionIndex = emailMessagesCollection.name + "_index";

  // Create the collection
  app.save(emailMessagesCollection);

  // Add index on lead_id for faster queries
  app.save(new Index({
    name: emailMessagesCollectionIndex,
    collectionId: emailMessagesCollection.id,
    fields: [
      {
        name: "lead_id",
        type: "relation"
      }
    ]
  }));
}, (app) => {
  // Rollback: delete the collection
  const emailMessagesCollection = app.findCollectionByName("email_messages");

  if (emailMessagesCollection) {
    app.delete(emailMessagesCollection);
  }
});
