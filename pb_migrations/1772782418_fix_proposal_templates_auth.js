/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // update collection API rules - allow authenticated users to view, admin/sales to manage
  unmarshal({
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'sales'",
    "deleteRule": "@request.auth.role = 'admin'",
    "listRule": "@request.auth.role != ''",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'sales'",
    "viewRule": "@request.auth.role != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_proposal_templates")

  // rollback to previous state (empty rules from migration 1772781709)
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
