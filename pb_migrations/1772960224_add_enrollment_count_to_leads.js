/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("leads");

  collection.addFieldName({
    "id": "number_enrollment_count",
    "name": "enrollment_count",
    "type": "number",
    "system": false,
    "required": false,
    "presentable": false,
    "hidden": false,
    "defaultValue": 0,
    "min": 0,
    "max": null,
    "onlyInt": true
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("leads");

  // Remove the field
  collection.fields.find(f => f.id === "number_enrollment_count")?.remove();

  return app.save(collection);
})
