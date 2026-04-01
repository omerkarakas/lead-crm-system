/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json2746655336",
    "maxSize": 0,
    "name": "scale_values",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2534458511",
    "max": null,
    "min": null,
    "name": "min_length",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number2518441531",
    "max": null,
    "min": null,
    "name": "max_length",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number274472576",
    "max": null,
    "min": null,
    "name": "max_selections",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666")

  // remove field
  collection.fields.removeById("json2746655336")

  // remove field
  collection.fields.removeById("number2534458511")

  // remove field
  collection.fields.removeById("number2518441531")

  // remove field
  collection.fields.removeById("number274472576")

  return app.save(collection)
})
