/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const appointments = new Collection({
    id: "appointments",
    creationId: "appointments_creation_id",
    name: "appointments",
    type: "base",
    fields: [
      {
        id: "appointments_lead_id",
        name: "lead_id",
        type: "relation",
        required: true,
        presentable: false,
        options: {
          collectionId: "leads_collection",
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        id: "appointments_calcom_booking_id",
        name: "calcom_booking_id",
        type: "text",
        required: true,
        presentable: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        },
        unique: true
      },
      {
        id: "appointments_calcom_event_id",
        name: "calcom_event_id",
        type: "text",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        id: "appointments_scheduled_at",
        name: "scheduled_at",
        type: "date",
        required: true,
        presentable: true,
        options: {
          min: null,
          max: null
        }
      },
      {
        id: "appointments_duration",
        name: "duration",
        type: "number",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null,
          noDecimal: true
        }
      },
      {
        id: "appointments_location",
        name: "location",
        type: "text",
        required: false,
        presentable: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        id: "appointments_meeting_url",
        name: "meeting_url",
        type: "url",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        id: "appointments_status",
        name: "status",
        type: "select",
        required: false,
        presentable: true,
        options: {
          values: ["scheduled", "completed", "cancelled", "rescheduled"],
          maxSelect: 1
        }
      },
      {
        id: "appointments_source",
        name: "source",
        type: "select",
        required: false,
        presentable: false,
        options: {
          values: ["calcom", "manual"],
          maxSelect: 1
        }
      },
      {
        id: "appointments_confirmation_sent",
        name: "confirmation_sent",
        type: "bool",
        required: false,
        presentable: false,
        options: {}
      },
      {
        id: "appointments_reminder_24h_sent",
        name: "reminder_24h_sent",
        type: "bool",
        required: false,
        presentable: false,
        options: {}
      },
      {
        id: "appointments_reminder_2h_sent",
        name: "reminder_2h_sent",
        type: "bool",
        required: false,
        presentable: false,
        options: {}
      },
      {
        id: "appointments_notes",
        name: "notes",
        type: "text",
        required: false,
        presentable: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        id: "appointments_created",
        name: "created",
        type: "date",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        id: "appointments_updated",
        name: "updated",
        type: "date",
        required: false,
        presentable: false,
        options: {
          min: null,
          max: null
        }
      }
    ],
    indexes: [
      {
        id: "appointments_lead_id_idx",
        name: "lead_id_idx",
        type: "index",
        fields: [
          {
            fieldId: "appointments_lead_id"
          }
        ]
      },
      {
        id: "appointments_scheduled_at_idx",
        name: "scheduled_at_idx",
        type: "index",
        fields: [
          {
            fieldId: "appointments_scheduled_at"
          }
        ]
      },
      {
        id: "appointments_status_idx",
        name: "status_idx",
        type: "index",
        fields: [
          {
            fieldId: "appointments_status"
          }
        ]
      }
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    options: {}
  });

  app.save(appointments);
}, (app) => {
  const appointments = app.findCollectionByNameOrId("appointments");

  app.delete(appointments);
});
