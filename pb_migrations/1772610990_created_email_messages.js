/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "system": true,
        "id": "id",
        "name": "id",
        "type": "text",
        "required": true,
        "presentable": false,
        "primaryKey": true,
        "hidden": false,
        "autogeneratePattern": "[a-z0-9]{15}",
        "pattern": "^[a-z0-9]+$",
        "min": 15,
        "max": 15
      },
      {
        "system": false,
        "id": "relation1772610991",
        "name": "lead_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "collectionId": "pbc_3705076665",
        "cascadeDelete": true,
        "minSelect": 1,
        "maxSelect": 1
      },
      {
        "system": false,
        "id": "email1772610992",
        "name": "to_email",
        "type": "email",
        "required": true,
        "presentable": false,
        "max": 255
      },
      {
        "system": false,
        "id": "text1772610993",
        "name": "subject",
        "type": "text",
        "required": true,
        "presentable": false,
        "min": 1,
        "max": 500
      },
      {
        "system": false,
        "id": "text1772610994",
        "name": "body",
        "type": "text",
        "required": true,
        "presentable": false,
        "min": 1,
        "max": 50000
      },
      {
        "system": false,
        "id": "text1772610995",
        "name": "template_id",
        "type": "text",
        "required": false,
        "presentable": false,
        "min": 1,
        "max": 100
      },
      {
        "system": false,
        "id": "select1772610996",
        "name": "direction",
        "type": "select",
        "required": true,
        "presentable": false,
        "values": ["incoming", "outgoing"]
      },
      {
        "system": false,
        "id": "select1772610997",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "values": ["pending", "sent", "delivered", "failed"]
      },
      {
        "system": false,
        "id": "date1772610998",
        "name": "sent_at",
        "type": "date",
        "required": false,
        "presentable": false
      },
      {
        "system": false,
        "id": "text1772610999",
        "name": "resend_message_id",
        "type": "text",
        "required": false,
        "presentable": false,
        "min": 1,
        "max": 500
      }
    ],
    "id": "pbc_email_messages",
    "name": "email_messages",
    "type": "base",
    "system": false,
    "indexes": [],
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "viewRule": "",
    "updateRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_messages");
  return app.delete(collection);
})
