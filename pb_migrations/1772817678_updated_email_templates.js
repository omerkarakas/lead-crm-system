/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_templates")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = 'admin'",
    "listRule": "@request.auth.role != ''",
    "updateRule": "@request.auth.role = 'admin'",
    "viewRule": "@request.auth.role != ''"
  }, collection)

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool3208210261",
    "name": "is_active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool3208210262",
    "name": "is_deleted",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_templates")

  // update collection data
  unmarshal({
    "createRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool3208210261",
    "name": "is_active",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool3208210262",
    "name": "is_deleted",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
