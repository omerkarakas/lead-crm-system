/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select3526408902",
    "maxSelect": 1,
    "name": "question_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "single",
      "multiple",
      "likert",
      "open"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // remove field
  collection.fields.removeById("select3526408902")

  return app.save(collection)
})
