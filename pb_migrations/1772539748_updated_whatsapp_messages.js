/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("whatsapp_messages_collection")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text5588365",
    "max": 0,
    "min": 0,
    "name": "lead_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select1045090739",
    "maxSelect": 1,
    "name": "direction",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "incoming",
      "outgoing"
    ]
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2451455006",
    "max": 0,
    "min": 0,
    "name": "message_text",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select625724656",
    "maxSelect": 1,
    "name": "message_type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "poll",
      "booking_link",
      "info",
      "error"
    ]
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "sent",
      "delivered",
      "read",
      "failed",
      "received"
    ]
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "date2531586952",
    "max": "",
    "min": "",
    "name": "sent_at",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1438847049",
    "max": 0,
    "min": 0,
    "name": "green_api_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "autodate2990389176",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "autodate3332085495",
    "name": "updated",
    "onCreate": false,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("whatsapp_messages_collection")

  // remove field
  collection.fields.removeById("text5588365")

  // remove field
  collection.fields.removeById("select1045090739")

  // remove field
  collection.fields.removeById("text2451455006")

  // remove field
  collection.fields.removeById("select625724656")

  // remove field
  collection.fields.removeById("select2063623452")

  // remove field
  collection.fields.removeById("date2531586952")

  // remove field
  collection.fields.removeById("text1438847049")

  // remove field
  collection.fields.removeById("autodate2990389176")

  // remove field
  collection.fields.removeById("autodate3332085495")

  return app.save(collection)
})
