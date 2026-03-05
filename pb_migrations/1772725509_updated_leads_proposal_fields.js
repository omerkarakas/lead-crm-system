/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665");

  // add offer_document_url field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_field_offer_document_url",
    "max": 500,
    "min": 0,
    "name": "offer_document_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  // add offer_date field
  collection.fields.addAt(24, new Field({
    "hidden": false,
    "id": "date_field_offer_date",
    "name": "offer_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }));

  // add offer_response field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "select_field_offer_response",
    "maxSelect": 1,
    "name": "offer_response",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "cevap_bekleniyor",
      "kabul",
      "red"
    ]
  }));

  // add offer_responded_at field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "date_field_offer_responded_at",
    "name": "offer_responded_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665");

  // remove fields in reverse order
  collection.fields.removeBy("id", "date_field_offer_responded_at");
  collection.fields.removeBy("id", "select_field_offer_response");
  collection.fields.removeBy("id", "date_field_offer_date");
  collection.fields.removeBy("id", "text_field_offer_document_url");

  return app.save(collection);
})
