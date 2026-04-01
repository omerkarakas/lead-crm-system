/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qa_answers_collection")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select645392226",
    "maxSelect": 1,
    "name": "selected_answerX",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "a",
      "b",
      "c",
      "d",
      "e"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("qa_answers_collection")

  // update field
  collection.fields.addAt(3, new Field({
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
      "c",
      "d",
      "e"
    ]
  }))

  return app.save(collection)
})
