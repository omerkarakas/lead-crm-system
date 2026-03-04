/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text1772610649",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "relation1772610650",
        "name": "lead_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation",
        "collectionId": "pbc_3705076665",
        "cascadeDelete": true,
        "minSelect": 1,
        "maxSelect": 1
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "email1772610651",
        "max": 255,
        "min": 1,
        "name": "to_email",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "email"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1772610652",
        "max": 500,
        "min": 1,
        "name": "subject",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1772610653",
        "max": 50000,
        "min": 1,
        "name": "body",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1772610654",
        "max": 100,
        "min": 0,
        "name": "template_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1772610655",
        "name": "direction",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["incoming", "outgoing"]
      },
      {
        "hidden": false,
        "id": "select1772610656",
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["pending", "sent", "delivered", "failed"]
      },
      {
        "hidden": false,
        "id": "date1772610657",
        "name": "sent_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1772610658",
        "max": 500,
        "min": 0,
        "name": "resend_message_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_email_messages",
    "indexes": [],
    "listRule": "",
    "name": "email_messages",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_messages");

  return app.delete(collection);
})
