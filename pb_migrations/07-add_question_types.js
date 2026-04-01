/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qa_questions_collection")

  // add question_type field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "question_type_field",
    "name": "question_type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "options": {
      "values": ["single", "multiple", "likert", "open"],
      "maxSelect": 1
    },
    "default": "single"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("qa_questions_collection")

  // remove question_type field
  collection.fields.removeById("question_type_field")

  return app.save(collection)
})
