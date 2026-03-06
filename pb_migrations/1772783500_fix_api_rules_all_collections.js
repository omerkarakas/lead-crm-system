/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // leads - authenticated users can access
  const leads = app.findCollectionByNameOrId("pbc_3705076665")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, leads)
  app.save(leads)

  // notes - authenticated users can access
  const notes = app.findCollectionByNameOrId("pbc_3395098727")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, notes)
  app.save(notes)

  // qa_questions - authenticated users can view, admin/sales can manage
  const qaQuestions = app.findCollectionByNameOrId("pbc_3705076666")
  unmarshal({
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'sales'",
    "deleteRule": "@request.auth.role = 'admin'",
    "listRule": "@request.auth.role != ''",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'sales'",
    "viewRule": "@request.auth.role != ''"
  }, qaQuestions)
  app.save(qaQuestions)

  // qa_answers - authenticated users can access
  const qaAnswers = app.findCollectionByNameOrId("qa_answers_collection")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, qaAnswers)
  app.save(qaAnswers)

  // whatsapp_messages - authenticated users can access
  const whatsappMessages = app.findCollectionByNameOrId("whatsapp_messages_collection")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, whatsappMessages)
  app.save(whatsappMessages)

  // email_messages - authenticated users can access
  const emailMessages = app.findCollectionByNameOrId("pbc_email_messages")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, emailMessages)
  app.save(emailMessages)

  // proposals - authenticated users OR public access via token for view, authenticated for write
  const proposals = app.findCollectionByNameOrId("pbc_3285277640")
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != '' || token != \"\"",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != '' || token != \"\""
  }, proposals)
  app.save(proposals)
}, (app) => {
  // rollback - set all rules back to empty
  const leads = app.findCollectionByNameOrId("pbc_3705076665")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, leads)
  app.save(leads)

  const notes = app.findCollectionByNameOrId("pbc_3395098727")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, notes)
  app.save(notes)

  const qaQuestions = app.findCollectionByNameOrId("pbc_3705076666")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, qaQuestions)
  app.save(qaQuestions)

  const qaAnswers = app.findCollectionByNameOrId("qa_answers_collection")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, qaAnswers)
  app.save(qaAnswers)

  const whatsappMessages = app.findCollectionByNameOrId("whatsapp_messages_collection")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, whatsappMessages)
  app.save(whatsappMessages)

  const emailMessages = app.findCollectionByNameOrId("pbc_email_messages")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, emailMessages)
  app.save(emailMessages)

  const proposals = app.findCollectionByNameOrId("pbc_3285277640")
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, proposals)
  app.save(proposals)
})
