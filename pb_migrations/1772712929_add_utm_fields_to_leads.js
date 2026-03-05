/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // add UTM source field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2394857101",
    "max": 200,
    "min": 0,
    "name": "utm_source",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add UTM medium field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3948571028",
    "max": 200,
    "min": 0,
    "name": "utm_medium",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add UTM campaign field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4758102938",
    "max": 200,
    "min": 0,
    "name": "utm_campaign",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add UTM content field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text5847102938",
    "max": 200,
    "min": 0,
    "name": "utm_content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add UTM term field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text6958203948",
    "max": 200,
    "min": 0,
    "name": "utm_term",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add UTM timestamp field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "date7102938475",
    "max": "",
    "min": "",
    "name": "utm_timestamp",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665")

  // remove fields in reverse order
  collection.fields.removeById("date7102938475") // utm_timestamp
  collection.fields.removeById("text6958203948") // utm_term
  collection.fields.removeById("text5847102938") // utm_content
  collection.fields.removeById("text4758102938") // utm_campaign
  collection.fields.removeById("text3948571028") // utm_medium
  collection.fields.removeById("text2394857101") // utm_source

  return app.save(collection)
})
