/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "name": "appointments",
    "type": "base",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text_field_lead_id",
        "max": null,
        "min": null,
        "name": "lead_id",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text_field_calcom_booking_id",
        "max": null,
        "min": null,
        "name": "calcom_booking_id",
        "pattern": "",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text",
        "unique": true
      },
      {
        "hidden": false,
        "id": "text_field_calcom_event_id",
        "max": null,
        "min": null,
        "name": "calcom_event_id",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date_field_scheduled_at",
        "name": "scheduled_at",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number_field_duration",
        "max": null,
        "min": null,
        "name": "duration",
        "noDecimal": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "text_field_location",
        "max": null,
        "min": null,
        "name": "location",
        "pattern": "",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "exceptDomains": [],
        "hidden": false,
        "id": "url_field_meeting_url",
        "name": "meeting_url",
        "onlyDomains": [],
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "select_field_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": ["scheduled", "completed", "cancelled", "rescheduled"]
      },
      {
        "hidden": false,
        "id": "select_field_source",
        "maxSelect": 1,
        "name": "source",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": ["calcom", "manual"]
      },
      {
        "hidden": false,
        "id": "bool_field_confirmation_sent",
        "name": "confirmation_sent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool_field_reminder_24h_sent",
        "name": "reminder_24h_sent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool_field_reminder_2h_sent",
        "name": "reminder_2h_sent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "text_field_notes",
        "max": null,
        "min": null,
        "name": "notes",
        "pattern": "",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate_field_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_field_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "autodate"
      }
    ]
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("appointments");
  if (collection) {
    app.delete(collection);
  }
});
