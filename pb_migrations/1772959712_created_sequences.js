/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_sequences",
    "name": "sequences",
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
        "id": "text_name",
        "name": "name",
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
        "id": "json_steps",
        "name": "steps",
        "type": "json",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "maxSize": 0
      },
      {
        "id": "bool_is_active",
        "name": "is_active",
        "type": "bool",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": true
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
      "CREATE INDEX idx_sequences_campaign_id ON sequences (campaign_id)",
      "CREATE INDEX idx_sequences_is_active ON sequences (is_active)",
      "CREATE INDEX idx_sequences_name ON sequences (name)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("sequences");

  return app.delete(collection);
})
