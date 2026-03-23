/**
 * TypeScript Types to JSON Schema Converter
 *
 * Converts TypeScript interface definitions to OpenAPI/JSON Schema format.
 * Used for generating request/response schemas from existing type definitions.
 */

import type { JSONSchema7 } from 'json-schema';

/** Schema reference format */
type SchemaRef = { $ref: string };

/** Convert TypeScript type to JSON Schema */
export function tsTypeToJsonSchema(typeName: string): JSONSchema7 | SchemaRef {
  const schemas: Record<string, JSONSchema7> = {
    // Lead types
    Lead: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lead unique identifier' },
        name: { type: 'string', description: 'Lead full name' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', format: 'email', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        website: { type: 'string', format: 'uri', description: 'Company website' },
        message: { type: 'string', description: 'Original message from lead' },
        source: {
          type: 'string',
          enum: ['web_form', 'api', 'manual', 'whatsapp'],
          description: 'How the lead was acquired',
        },
        status: {
          type: 'string',
          enum: ['new', 'qualified', 'booked', 'customer', 'lost', 're-apply'],
          description: 'Current lead status',
        },
        score: { type: 'number', description: 'Qualification score (0-100)' },
        total_score: { type: 'number', description: 'Total score including all factors' },
        quality: {
          type: 'string',
          enum: ['pending', 'qualified', 'followup'],
          description: 'Quality assessment',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom tags for categorization',
        },
        createdBy: { type: 'string', description: 'User ID who created the lead' },
        qa_sent: { type: 'boolean', description: 'Whether QA poll was sent' },
        qa_sent_at: { type: 'string', format: 'date-time', description: 'QA poll sent timestamp' },
        qa_completed: { type: 'boolean', description: 'Whether QA was completed' },
        qa_completed_at: { type: 'string', format: 'date-time', description: 'QA completion timestamp' },
        offer_response: { type: 'string', description: 'Response to offer' },
        offer_responded_at: { type: 'string', format: 'date-time', description: 'Offer response timestamp' },
        auto_updated_status: { type: 'boolean', description: 'Whether status was auto-updated' },
        auto_updated_at: { type: 'string', format: 'date-time', description: 'Auto-update timestamp' },
        utm_source: { type: 'string', description: 'UTM source parameter' },
        utm_medium: { type: 'string', description: 'UTM medium parameter' },
        utm_campaign: { type: 'string', description: 'UTM campaign parameter' },
        utm_content: { type: 'string', description: 'UTM content parameter' },
        utm_term: { type: 'string', description: 'UTM term parameter' },
        utm_timestamp: { type: 'string', format: 'date-time', description: 'UTM timestamp' },
        created: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
        updated: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
      },
      required: ['id', 'name', 'source', 'status', 'score', 'quality', 'tags', 'qa_sent', 'qa_completed', 'created', 'updated'],
    },

    CreateLeadDto: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Lead full name (required)' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', format: 'email', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        website: { type: 'string', format: 'uri', description: 'Company website' },
        message: { type: 'string', description: 'Original message from lead' },
        source: {
          type: 'string',
          enum: ['web_form', 'api', 'manual', 'whatsapp'],
          description: 'How the lead was acquired',
        },
        status: {
          type: 'string',
          enum: ['new', 'qualified', 'booked', 'customer', 'lost', 're-apply'],
          description: 'Initial status (defaults to "new")',
        },
        score: { type: 'number', description: 'Initial score (defaults to 0)' },
        quality: {
          type: 'string',
          enum: ['pending', 'qualified', 'followup'],
          description: 'Initial quality (defaults to "pending")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom tags',
        },
        utm_source: { type: 'string' },
        utm_medium: { type: 'string' },
        utm_campaign: { type: 'string' },
        utm_content: { type: 'string' },
        utm_term: { type: 'string' },
        utm_timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['name', 'source'],
    },

    UpdateLeadDto: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        company: { type: 'string' },
        website: { type: 'string', format: 'uri' },
        message: { type: 'string' },
        source: { type: 'string', enum: ['web_form', 'api', 'manual', 'whatsapp'] },
        status: { type: 'string', enum: ['new', 'qualified', 'booked', 'customer', 'lost', 're-apply'] },
        score: { type: 'number' },
        total_score: { type: 'number' },
        quality: { type: 'string', enum: ['pending', 'qualified', 'followup'] },
        tags: { type: 'array', items: { type: 'string' } },
        qa_sent: { type: 'boolean' },
        qa_sent_at: { type: 'string', format: 'date-time' },
        qa_completed: { type: 'boolean' },
        qa_completed_at: { type: 'string', format: 'date-time' },
        offer_response: { type: 'string' },
        offer_responded_at: { type: 'string', format: 'date-time' },
        auto_updated_status: { type: 'boolean' },
        auto_updated_at: { type: 'string', format: 'date-time' },
        utm_source: { type: 'string' },
        utm_medium: { type: 'string' },
        utm_campaign: { type: 'string' },
        utm_content: { type: 'string' },
        utm_term: { type: 'string' },
        utm_timestamp: { type: 'string', format: 'date-time' },
      },
    },

    // Appointment types
    Appointment: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        lead_id: { type: 'string', description: 'Associated lead ID' },
        calcom_booking_id: { type: 'string', description: 'Cal.com booking ID' },
        calcom_event_id: { type: 'string', description: 'Cal.com event type ID' },
        scheduled_at: { type: 'string', format: 'date-time', description: 'Scheduled time' },
        duration: { type: 'number', description: 'Duration in minutes' },
        status: {
          type: 'string',
          enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
          description: 'Appointment status',
        },
        source: {
          type: 'string',
          enum: ['calcom', 'manual'],
          description: 'How appointment was created',
        },
        location: { type: 'string', description: 'Meeting location' },
        meeting_url: { type: 'string', format: 'uri', description: 'Online meeting URL' },
        notes: { type: 'string', description: 'Appointment notes' },
        confirmation_sent: { type: 'boolean', description: 'WhatsApp confirmation sent' },
        reminder_24h_sent: { type: 'boolean', description: '24h reminder sent' },
        reminder_2h_sent: { type: 'boolean', description: '2h reminder sent' },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'calcom_booking_id', 'scheduled_at', 'status', 'source', 'duration', 'created', 'updated'],
    },

    CreateAppointmentDto: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'Associate with existing lead' },
        calcom_booking_id: { type: 'string', description: 'Cal.com booking ID (required)' },
        calcom_event_id: { type: 'string', description: 'Cal.com event type ID' },
        scheduled_at: { type: 'string', format: 'date-time', description: 'Appointment time (required)' },
        duration: { type: 'number', description: 'Duration in minutes (default: 60)' },
        status: {
          type: 'string',
          enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
          description: 'Initial status (default: scheduled)',
        },
        source: { type: 'string', enum: ['calcom', 'manual'], description: 'Source (default: manual)' },
        location: { type: 'string' },
        meeting_url: { type: 'string', format: 'uri' },
        notes: { type: 'string' },
      },
      required: ['calcom_booking_id', 'scheduled_at'],
    },

    // Campaign types
    Campaign: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'Campaign name' },
        description: { type: 'string', description: 'Campaign description' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'archived'],
          description: 'Campaign status',
        },
        segments: {
          type: 'array',
          description: 'Targeting segments',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'Field to filter on (e.g., status, score, tags)' },
              operator: {
                type: 'string',
                enum: ['equals', 'contains', 'gt', 'lt', 'gte', 'lte'],
                description: 'Comparison operator',
              },
              value: { description: 'Value to compare against' },
            },
          },
        },
        enrollCount: { type: 'number', description: 'Number of enrolled leads' },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'name', 'status', 'created', 'updated'],
    },

    CreateCampaignDto: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name (required)' },
        description: { type: 'string', description: 'Campaign description' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'archived'],
          description: 'Initial status (default: active)',
        },
        segments: {
          type: 'array',
          description: 'Targeting segments',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              operator: { type: 'string', enum: ['equals', 'contains', 'gt', 'lt', 'gte', 'lte'] },
              value: {},
            },
          },
        },
      },
      required: ['name'],
    },

    // Sequence types
    Sequence: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        campaignId: { type: 'string', description: 'Associated campaign ID' },
        name: { type: 'string', description: 'Sequence name' },
        steps: {
          type: 'array',
          description: 'Sequence steps',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              order: { type: 'number', description: 'Execution order' },
              type: {
                type: 'string',
                enum: ['email', 'wait', 'webhook'],
                description: 'Step type',
              },
              delayDays: { type: 'number', description: 'Days to wait before this step' },
              delayHours: { type: 'number', description: 'Hours to wait (added to days)' },
              subject: { type: 'string', description: 'Email subject (for email steps)' },
              body: { type: 'string', description: 'Email body or webhook payload' },
              url: { type: 'string', format: 'uri', description: 'Webhook URL (for webhook steps)' },
              method: { type: 'string', description: 'HTTP method for webhook' },
            },
          },
        },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'campaignId', 'name', 'steps', 'created', 'updated'],
    },

    // Proposal types
    Proposal: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        leadId: { type: 'string', description: 'Associated lead ID' },
        templateId: { type: 'string', description: 'Template used' },
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'accepted', 'rejected', 'countered'],
          description: 'Proposal status',
        },
        content: { type: 'string', description: 'Proposal content' },
        amount: { type: 'number', description: 'Proposed amount' },
        currency: { type: 'string', description: 'Currency code' },
        sent_at: { type: 'string', format: 'date-time' },
        responded_at: { type: 'string', format: 'date-time' },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'leadId', 'status', 'created', 'updated'],
    },

    ProposalTemplate: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'Template name' },
        description: { type: 'string', description: 'Template description' },
        content: { type: 'string', description: 'Template content with variables' },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available variables (e.g., lead.name, lead.company)',
        },
        isActive: { type: 'boolean', description: 'Whether template is active' },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'name', 'content', 'isActive', 'created', 'updated'],
    },

    // Email Template types
    EmailTemplate: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'Template name' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body with variables' },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available variables',
        },
        isActive: { type: 'boolean', description: 'Whether template is active' },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'name', 'subject', 'body', 'isActive', 'created', 'updated'],
    },

    // Settings types
    Settings: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        notifications: {
          type: 'object',
          description: 'Notification preferences',
          properties: {
            email: { type: 'boolean' },
            whatsapp: { type: 'boolean' },
            proposals: { type: 'boolean' },
            appointments: { type: 'boolean' },
          },
        },
        integrations: {
          type: 'object',
          description: 'Integration settings',
          properties: {
            email: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                host: { type: 'string' },
                port: { type: 'number' },
                secure: { type: 'boolean' },
                auth: {
                  type: 'object',
                  properties: {
                    user: { type: 'string' },
                    pass: { type: 'string' },
                  },
                },
              },
            },
            whatsapp: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                apiKey: { type: 'string' },
                phoneNumberId: { type: 'string' },
              },
            },
            calcom: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                apiKey: { type: 'string' },
                eventTypeId: { type: 'string' },
              },
            },
          },
        },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'userId', 'notifications', 'integrations', 'created', 'updated'],
    },
  };

  return schemas[typeName] || { type: 'object' };
}

/** Get all available schema definitions for OpenAPI components */
export function getAllSchemaDefinitions(): Record<string, JSONSchema7> {
  const schemaMap = tsTypeToJsonSchema('Lead') as JSONSchema7;
  const definitions: Record<string, JSONSchema7> = {};

  // Collect all schemas
  const types: string[] = [
    'Lead',
    'CreateLeadDto',
    'UpdateLeadDto',
    'Appointment',
    'CreateAppointmentDto',
    'Campaign',
    'CreateCampaignDto',
    'Sequence',
    'Proposal',
    'ProposalTemplate',
    'EmailTemplate',
    'Settings',
  ];

  for (const type of types) {
    definitions[type] = tsTypeToJsonSchema(type) as JSONSchema7;
  }

  return definitions;
}
