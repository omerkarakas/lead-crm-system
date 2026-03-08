/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_campaign_enrollments",
    "name": "campaign_enrollments",
    "type": "base",
    "system": false,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "listRule": null,
    "viewRule": null,
    "fields": [
      {
        "id": "text_campaign_id",
        "name": "campaign_id",
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
        "id": "text_sequence_id",
        "name": "sequence_id",
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
        "id": "text_lead_id",
        "name": "lead_id",
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
        "id": "select_status",
        "name": "status",
        "type": "select",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": "active",
        "options": {
          "maxSelect": 1,
          "values": [
            "active",
            "completed",
            "failed",
            "unsubscribed"
          ]
        }
      },
      {
        "id": "number_current_step",
        "name": "current_step",
        "type": "number",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": 0,
        "min": 0,
        "max": null,
        "onlyInt": true
      },
      {
        "id": "date_enrolled_at",
        "name": "enrolled_at",
        "type": "date",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null
      },
      {
        "id": "date_completed_at",
        "name": "completed_at",
        "type": "date",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null
      },
      {
        "id": "date_unsubscribed_at",
        "name": "unsubscribed_at",
        "type": "date",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null
      },
      {
        "id": "text_unsubscribe_token",
        "name": "unsubscribe_token",
        "type": "text",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "pattern": "",
        "max": 64,
        "min": 32
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
      "CREATE UNIQUE INDEX idx_campaign_enrollments_unique_enrollment ON campaign_enrollments (lead_id, campaign_id)",
      "CREATE INDEX idx_campaign_enrollments_lead_id ON campaign_enrollments (lead_id)",
      "CREATE INDEX idx_campaign_enrollments_campaign_id ON campaign_enrollments (campaign_id)",
      "CREATE INDEX idx_campaign_enrollments_status ON campaign_enrollments (status)",
      "CREATE UNIQUE INDEX idx_campaign_enrollments_unsubscribe_token ON campaign_enrollments (unsubscribe_token)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("campaign_enrollments");

  return app.delete(collection);
})
