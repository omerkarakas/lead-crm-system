/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_campaigns",
    "name": "campaigns",
    "type": "base",
    "system": false,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "listRule": null,
    "viewRule": null,
    "fields": [
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
        "id": "text_description",
        "name": "description",
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
        "id": "select_type",
        "name": "type",
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
        "id": "json_audience_segment",
        "name": "audience_segment",
        "type": "json",
        "system": false,
        "required": true,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "maxSize": 0
      },
      {
        "id": "number_auto_enroll_min_score",
        "name": "auto_enroll_min_score",
        "type": "number",
        "system": false,
        "required": false,
        "presentable": false,
        "hidden": false,
        "defaultValue": null,
        "min": 0,
        "max": 100,
        "onlyInt": true
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
      "CREATE INDEX idx_campaigns_is_active ON campaigns (is_active)",
      "CREATE INDEX idx_campaigns_type ON campaigns (type)",
      "CREATE INDEX idx_campaigns_name ON campaigns (name)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("campaigns");

  return app.delete(collection);
})
