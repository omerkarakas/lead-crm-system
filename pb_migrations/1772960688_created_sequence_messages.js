/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_sequence_messages",
    "name": "sequence_messages",
    "type": "base",
    "system": false,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "listRule": null,
    "viewRule": null,
    "fields": [
      {
        "id": "text_enrollment_id",
        "name": "enrollment_id",
        "type": "text",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "pattern": "",
        "max": 0,
        "min": 0
      },
      {
        "id": "text_step_id",
        "name": "step_id",
        "type": "text",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "pattern": "",
        "max": 0,
        "min": 0
      },
      {
        "id": "number_step_order",
        "name": "step_order",
        "type": "number",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "min": 0,
        "max": null,
        "onlyInt": true
      },
      {
        "id": "select_step_type",
        "name": "step_type",
        "type": "select",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "options": {
          "maxSelect": 1,
          "values": [
            "email",
            "whatsapp"
          ]
        }
      },
      {
        "id": "text_template_id",
        "name": "template_id",
        "type": "text",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "pattern": "",
        "max": 0,
        "min": 0
      },
      {
        "id": "select_status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": "pending",
        "options": {
          "maxSelect": 1,
          "values": [
            "pending",
            "sent",
            "failed"
          ]
        }
      },
      {
        "id": "date_sent_at",
        "name": "sent_at",
        "type": "date",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null
      },
      {
        "id": "text_error_message",
        "name": "error_message",
        "type": "text",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "pattern": "",
        "max": 0,
        "min": 0
      },
      {
        "id": "autodate_created",
        "name": "created",
        "type": "autodate",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "onCreate": true,
        "onUpdate": false
      },
      {
        "id": "autodate_updated",
        "name": "updated",
        "type": "autodate",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "onCreate": true,
        "onUpdate": true
      }
    ],
    "indexes": [
      "CREATE INDEX idx_sequence_messages_enrollment_id ON sequence_messages (enrollment_id)",
      "CREATE INDEX idx_sequence_messages_status ON sequence_messages (status)",
      "CREATE INDEX idx_sequence_messages_sent_at ON sequence_messages (sent_at)",
      "CREATE INDEX idx_sequence_messages_step_order ON sequence_messages (step_order)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("sequence_messages");

  return app.delete(collection);
})
