/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool3208210263",
    "name": "is_deleted",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool3208210263",
    "name": "is_deleted",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
