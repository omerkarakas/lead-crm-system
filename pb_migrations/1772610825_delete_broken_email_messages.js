/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Find and delete the broken email_messages collection
  const collections = app.getCollections();

  for (const collection of collections) {
    if (collection.name === "email_messages") {
      app.delete(collection);
      break;
    }
  }
}, (app) => {
  // No rollback needed
})
