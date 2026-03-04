/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qa_answers_collection")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "select645392226",
    "maxSelect": 1,
    "name": "selected_answer",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "a",
      "b",
      "c"
    ]
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number2092809343",
    "max": null,
    "min": null,
    "name": "points_earned",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "autodate1825864417",
    "name": "answered_at",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("qa_answers_collection")

  // remove field
  collection.fields.removeById("select645392226")

  // remove field
  collection.fields.removeById("number2092809343")

  // remove field
  collection.fields.removeById("autodate1825864417")

  return app.save(collection)
})
