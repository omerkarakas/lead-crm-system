/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210300",
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
        "id": "text3208210301",
        "max": 50000,
        "min": 1,
        "name": "content",
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
        "id": "text3208210302",
        "max": 50000,
        "min": 1,
        "name": "filled_content",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json3208210303",
        "name": "variables_used",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210304",
        "max": 100,
        "min": 1,
        "name": "token",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date3208210305",
        "name": "expires_at",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select3208210306",
        "maxSelect": 1,
        "name": "response",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "cevap_bekleniyor",
          "kabul",
          "red"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210307",
        "max": 1000,
        "min": 0,
        "name": "response_comment",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date3208210308",
        "name": "responded_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "collectionId": "pbc_3705076665",
        "cascadeDelete": false,
        "hidden": false,
        "id": "relation3208210309",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lead_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "collectionId": "pbc_proposal_templates",
        "cascadeDelete": false,
        "hidden": false,
        "id": "relation3208210310",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "template_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate2990389177",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085496",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_3285277640",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_token` ON `proposals` (`token`)",
      "CREATE INDEX `idx_lead_id` ON `proposals` (`lead_id`)",
      "CREATE INDEX `idx_expires_at` ON `proposals` (`expires_at`)"
    ],
    "listRule": "",
    "name": "proposals",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3285277640");

  return app.delete(collection);
})
