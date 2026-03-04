/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_templates");

  collection.listRule = "@request.auth.role != ''";
  collection.viewRule = "@request.auth.role != ''";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_email_templates");

  collection.listRule = "@request.auth.role = 'admin'";
  collection.viewRule = "@request.auth.role = 'admin'";

  return app.save(collection);
})
