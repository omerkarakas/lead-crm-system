/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("campaign_enrollments");

  collection.addField(new Field({
    "id": "date_next_step_scheduled",
    "name": "next_step_scheduled",
    "type": "date",
    "system": false,
    "required": false,
    "presentable": false,
    "hidden": false,
    "defaultValue": null
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("campaign_enrollments");

  // Remove the field
  collection.fields.removeBy("name", "next_step_scheduled");

  return app.save(collection);
})
