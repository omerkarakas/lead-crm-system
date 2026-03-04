/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "bool890795441",
    "name": "qa_sent",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "date915922603",
    "max": "",
    "min": "",
    "name": "qa_sent_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "bool3247363849",
    "name": "qa_completed",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "date2022152685",
    "max": "",
    "min": "",
    "name": "qa_completed_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number4058751331",
    "max": null,
    "min": null,
    "name": "total_score",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // remove field
  collection.fields.removeById("bool890795441")

  // remove field
  collection.fields.removeById("date915922603")

  // remove field
  collection.fields.removeById("bool3247363849")

  // remove field
  collection.fields.removeById("date2022152685")

  // remove field
  collection.fields.removeById("number4058751331")

  return app.save(collection)
})
