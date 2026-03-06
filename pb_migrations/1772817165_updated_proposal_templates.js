/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'sales'",
    "deleteRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "updateRule": ""
  }, collection)

  return app.save(collection)
})
