/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3126690926")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool458715613",
    "name": "is_active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3126690926")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool458715613",
    "name": "is_active",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
