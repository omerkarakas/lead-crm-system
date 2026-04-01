/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json1874629670",
    "maxSize": 0,
    "name": "options",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "json2874629671",
    "maxSize": 0,
    "name": "points",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json1874629670",
    "maxSize": 0,
    "name": "options",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "json"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "json2874629671",
    "maxSize": 0,
    "name": "points",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
