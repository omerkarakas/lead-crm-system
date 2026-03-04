/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // update field
  collection.fields.addAt(5, new Field({
    "exceptDomains": [],
    "hidden": false,
    "id": "url1198480871",
    "name": "website",
    "onlyDomains": [],
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // update field
  collection.fields.addAt(5, new Field({
    "exceptDomains": [],
    "hidden": false,
    "id": "url1198480871",
    "name": "website",
    "onlyDomains": [],
    "presentable": false,
    "required": true,
    "system": false,
    "type": "url"
  }))

  return app.save(collection)
})
