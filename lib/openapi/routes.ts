/**
 * OpenAPI Route Definitions for Moka CRM API
 *
 * This file defines all API endpoints with their methods, parameters,
 * request bodies, and response schemas.
 */

import type { OpenAPIPaths, OpenAPITag } from 'openapi-types';

/** API Tags - groups endpoints by category */
export const tags: OpenAPITag[] = [
  { name: 'Leads', description: 'Lead management - create, list, update, delete leads' },
  { name: 'Appointments', description: 'Appointment scheduling and management via Cal.com integration' },
  { name: 'Campaigns', description: 'Campaign and nurturing sequence management' },
  { name: 'Sequences', description: 'Email sequence templates and execution' },
  { name: 'Webhooks', description: 'Webhook endpoints for external integrations' },
  { name: 'Proposals', description: 'Proposal creation, sending, and tracking' },
  { name: 'Templates', description: 'Email and proposal templates' },
  { name: 'Settings', description: 'User and system settings management' },
  { name: 'Users', description: 'User session and authentication management' },
  { name: 'Cron', description: 'Scheduled task endpoints' },
];

/** Security Schemes */
export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token from PocketBase authentication. Use `Authorization: Bearer <token>` header.',
  },
  api_key: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key for webhook and external integrations.',
  },
} as const;

/** Common response schemas */
const errorResponses = {
  400: {
    description: 'Bad Request - Invalid input or parameters',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  },
  401: {
    description: 'Unauthorized - Authentication required',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized - Authentication required' },
          },
        },
      },
    },
  },
  403: {
    description: 'Forbidden - Insufficient permissions',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Forbidden - You do not have permission' },
          },
        },
      },
    },
  },
  429: {
    description: 'Too Many Requests - Rate limit exceeded',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Too many requests' },
            retryAfter: { type: 'number' },
          },
        },
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  },
};

/** Pagination parameters */
const paginationParams = {
  page: {
    name: 'page',
    in: 'query',
    description: 'Page number for pagination',
    schema: { type: 'integer', default: 1, minimum: 1 },
  },
  perPage: {
    name: 'perPage',
    in: 'query',
    description: 'Items per page',
    schema: { type: 'integer', default: 50, minimum: 1, maximum: 100 },
  },
  sort: {
    name: 'sort',
    in: 'query',
    description: 'Sort order (e.g., "-created" for newest first)',
    schema: { type: 'string', example: '-created' },
  },
};

/** Export paths object */
export const paths: OpenAPIPaths = {
  // ============================================
  // LEADS
  // ============================================
  '/api/leads': {
    get: {
      tags: ['Leads'],
      summary: 'Get all leads with pagination and filtering',
      description: 'Retrieve a paginated list of leads. Supports filtering by status, tags, search, and date range.',
      parameters: [
        paginationParams.page,
        paginationParams.perPage,
        paginationParams.sort,
        {
          name: 'search',
          in: 'query',
          description: 'Search in name, email, phone, company',
          schema: { type: 'string' },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by lead status',
          schema: {
            type: 'string',
            enum: ['new', 'qualified', 'booked', 'customer', 'lost', 're-apply'],
          },
        },
        {
          name: 'tags',
          in: 'query',
          description: 'Filter by tags (comma-separated)',
          schema: { type: 'string' },
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter by created date (start)',
          schema: { type: 'string', format: 'date' },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter by created date (end)',
          schema: { type: 'string', format: 'date' },
        },
      ],
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  perPage: { type: 'integer' },
                  totalItems: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Lead' },
                  },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Leads'],
      summary: 'Create a new lead',
      description: 'Create a new lead. Triggers automatic qualification scoring and campaign enrollment.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateLeadDto' },
          },
        },
      },
      responses: {
        201: {
          description: 'Lead created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  lead: { $ref: '#/components/schemas/Lead' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/leads/{id}': {
    get: {
      tags: ['Leads'],
      summary: 'Get a single lead by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Lead' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Leads'],
      summary: 'Update a lead',
      description: 'Update lead details. Changing score, status, tags, or source triggers campaign re-evaluation.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateLeadDto' },
          },
        },
      },
      responses: {
        200: {
          description: 'Lead updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  lead: { $ref: '#/components/schemas/Lead' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Leads'],
      summary: 'Delete a lead',
      description: 'Permanently delete a lead (admin only).',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Lead deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/leads/{id}/send-poll': {
    post: {
      tags: ['Leads'],
      summary: 'Send QA poll to a lead via WhatsApp',
      description: 'Triggers qualification questions to be sent to the lead via WhatsApp.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'QA poll sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/leads/{id}/reset-qualification': {
    post: {
      tags: ['Leads'],
      summary: 'Reset lead qualification status',
      description: 'Resets QA status allowing re-qualification.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Qualification reset successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/leads/{id}/enroll': {
    post: {
      tags: ['Leads', 'Campaigns'],
      summary: 'Enroll a lead in a campaign',
      description: 'Manually enroll a lead into a specific campaign.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Lead ID',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['campaignId'],
              properties: {
                campaignId: {
                  type: 'string',
                  description: 'Campaign ID to enroll in',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Enrollment successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // APPOINTMENTS
  // ============================================
  '/api/appointments': {
    get: {
      tags: ['Appointments'],
      summary: 'Get all appointments with filtering',
      description: 'Retrieve paginated list of appointments. Filter by lead, status, date range.',
      parameters: [
        paginationParams.page,
        paginationParams.perPage,
        paginationParams.sort,
        {
          name: 'leadId',
          in: 'query',
          description: 'Filter by lead ID',
          schema: { type: 'string' },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by status',
          schema: {
            type: 'string',
            enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
          },
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter by scheduled date (start)',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter by scheduled date (end)',
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  perPage: { type: 'integer' },
                  totalItems: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Appointment' },
                  },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Appointments'],
      summary: 'Create a new appointment',
      description: 'Create an appointment manually. Sends WhatsApp confirmation.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateAppointmentDto' },
          },
        },
      },
      responses: {
        201: {
          description: 'Appointment created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  appointment: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/appointments/{id}': {
    get: {
      tags: ['Appointments'],
      summary: 'Get a single appointment',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Appointment' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Appointments'],
      summary: 'Update an appointment',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                scheduled_at: { type: 'string', format: 'date-time' },
                status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no-show'] },
                location: { type: 'string' },
                meeting_url: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  appointment: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Appointments'],
      summary: 'Delete an appointment',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/appointments/{id}/send-confirmation': {
    post: {
      tags: ['Appointments'],
      summary: 'Send appointment confirmation via WhatsApp',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Confirmation sent',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/appointments/{id}/status': {
    patch: {
      tags: ['Appointments'],
      summary: 'Update appointment status',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Status updated',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/appointments/{id}/complete': {
    post: {
      tags: ['Appointments'],
      summary: 'Mark appointment as completed',
      description: 'Sets status to completed and optionally updates lead status.',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                updateLeadStatus: { type: 'boolean', description: 'Also update lead status' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Appointment completed',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // CAMPAIGNS
  // ============================================
  '/api/campaigns': {
    get: {
      tags: ['Campaigns'],
      summary: 'Get all campaigns',
      description: 'Retrieve all campaigns with their stats.',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Campaigns'],
      summary: 'Create a new campaign',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCampaignDto' },
          },
        },
      },
      responses: {
        201: {
          description: 'Campaign created',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, campaign: { $ref: '#/components/schemas/Campaign' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaigns/{id}': {
    get: {
      tags: ['Campaigns'],
      summary: 'Get a single campaign',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Campaign' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Campaigns'],
      summary: 'Update a campaign',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['active', 'paused', 'archived'] },
                segments: {
                  type: 'array',
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
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Campaigns'],
      summary: 'Delete a campaign',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Deleted',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaigns/{id}/sequences': {
    get: {
      tags: ['Campaigns', 'Sequences'],
      summary: 'Get campaign sequences',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Sequence' },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaigns/{id}/enroll': {
    post: {
      tags: ['Campaigns'],
      summary: 'Enroll leads in campaign',
      description: 'Trigger enrollment evaluation for campaign.',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Enrollment triggered',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaigns/{id}/unenroll': {
    post: {
      tags: ['Campaigns'],
      summary: 'Unenroll a lead from campaign',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['leadId'],
              properties: {
                leadId: { type: 'string', description: 'Lead ID to unenroll' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Unenrolled',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaigns/preview': {
    get: {
      tags: ['Campaigns'],
      summary: 'Preview campaign matching leads',
      parameters: [
        { name: 'campaignId', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Preview results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leads: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Lead' },
                  },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // SEQUENCES
  // ============================================
  '/api/sequences': {
    get: {
      tags: ['Sequences'],
      summary: 'Get all sequences',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/Sequence' } },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Sequences'],
      summary: 'Create a new sequence',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'campaignId', 'steps'],
              properties: {
                name: { type: 'string' },
                campaignId: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      order: { type: 'integer' },
                      type: { type: 'string', enum: ['email', 'wait', 'webhook'] },
                      delayDays: { type: 'integer' },
                      subject: { type: 'string' },
                      body: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { success: { type: 'boolean' }, sequence: { $ref: '#/components/schemas/Sequence' } } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/sequences/{id}': {
    get: {
      tags: ['Sequences'],
      summary: 'Get a sequence',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Sequence' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Sequences'],
      summary: 'Update a sequence',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                steps: { type: 'array', items: {} },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Sequences'],
      summary: 'Delete a sequence',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Deleted' },
        ...errorResponses,
      },
    },
  },

  '/api/sequences/{id}/start': {
    post: {
      tags: ['Sequences'],
      summary: 'Manually start a sequence for a lead',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['leadId'],
              properties: {
                leadId: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Sequence started' },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // ENROLLMENTS
  // ============================================
  '/api/campaign-enrollments': {
    get: {
      tags: ['Campaigns'],
      summary: 'Get all campaign enrollments',
      parameters: [
        { name: 'campaignId', in: 'query', schema: { type: 'string' } },
        { name: 'leadId', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { type: 'object' } },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/campaign-enrollments/{id}/unsubscribe': {
    post: {
      tags: ['Campaigns'],
      summary: 'Unsubscribe from campaign',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Unsubscribed' },
        ...errorResponses,
      },
    },
  },

  '/api/enrollments/{id}/retry': {
    post: {
      tags: ['Campaigns'],
      summary: 'Retry failed sequence step',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Retry triggered' },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // WEBHOOKS
  // ============================================
  '/api/webhooks/leads': {
    post: {
      tags: ['Webhooks'],
      summary: 'Create lead from webhook',
      description: 'Public endpoint to create leads from external sources (Meta Ads, forms, etc.)',
      security: [{ api_key: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateLeadDto' },
          },
        },
      },
      responses: {
        201: {
          description: 'Lead created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  lead: { $ref: '#/components/schemas/Lead' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/webhooks/leads/{id}': {
    patch: {
      tags: ['Webhooks'],
      summary: 'Update lead from webhook',
      security: [{ api_key: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateLeadDto' },
          },
        },
      },
      responses: {
        200: {
          description: 'Lead updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  lead: { $ref: '#/components/schemas/Lead' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/webhooks/calcom': {
    post: {
      tags: ['Webhooks'],
      summary: 'Cal.com booking webhook',
      description: 'Receives booking events from Cal.com to create appointments.',
      security: [{ api_key: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                event: { type: 'string' },
                payload: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Webhook processed' },
        ...errorResponses,
      },
    },
  },

  '/api/webhooks/meta-ads': {
    post: {
      tags: ['Webhooks'],
      summary: 'Meta Ads lead webhook',
      description: 'Receives lead data from Meta (Facebook) Ads.',
      security: [{ api_key: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
      responses: {
        201: {
          description: 'Lead created from ad',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  lead: { $ref: '#/components/schemas/Lead' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/webhooks/qa-complete': {
    post: {
      tags: ['Webhooks'],
      summary: 'QA completion webhook',
      description: 'Receives notification when QA poll is completed via WhatsApp.',
      security: [{ api_key: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['leadId'],
              properties: {
                leadId: { type: 'string' },
                answers: { type: 'object' },
                score: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'QA processed' },
        ...errorResponses,
      },
    },
  },

  '/api/whatsapp/webhook': {
    post: {
      tags: ['Webhooks'],
      summary: 'WhatsApp webhook',
      description: 'Receives messages and status updates from WhatsApp API.',
      security: [{ api_key: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
      responses: {
        200: { description: 'Webhook processed' },
      },
    },
  },

  // ============================================
  // PROPOSALS
  // ============================================
  '/api/proposals': {
    get: {
      tags: ['Proposals'],
      summary: 'Get all proposals',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/Proposal' } },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Proposals'],
      summary: 'Create a proposal',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['leadId', 'templateId'],
              properties: {
                leadId: { type: 'string' },
                templateId: { type: 'string' },
                customizations: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Proposal created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  proposal: { $ref: '#/components/schemas/Proposal' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/proposals/{id}': {
    get: {
      tags: ['Proposals'],
      summary: 'Get a proposal',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Proposal' },
            },
          },
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Proposals'],
      summary: 'Delete a proposal',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Deleted' },
        ...errorResponses,
      },
    },
  },

  '/api/proposals/send': {
    post: {
      tags: ['Proposals'],
      summary: 'Send a proposal',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['proposalId'],
              properties: {
                proposalId: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Proposal sent' },
        ...errorResponses,
      },
    },
  },

  '/api/proposals/respond': {
    post: {
      tags: ['Proposals'],
      summary: 'Record proposal response',
      description: 'Public endpoint for leads to respond to proposals.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['proposalId', 'response'],
              properties: {
                proposalId: { type: 'string' },
                response: { type: 'string', enum: ['accepted', 'rejected', 'countered'] },
                counterAmount: { type: 'number' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Response recorded' },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // TEMPLATES
  // ============================================
  '/api/proposal-templates': {
    get: {
      tags: ['Templates'],
      summary: 'Get all proposal templates',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/ProposalTemplate' } },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Templates'],
      summary: 'Create a proposal template',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'content'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
                variables: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Template variables (e.g., {{lead.name}})',
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created' },
        ...errorResponses,
      },
    },
  },

  '/api/proposal-templates/{id}': {
    get: {
      tags: ['Templates'],
      summary: 'Get a proposal template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProposalTemplate' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Templates'],
      summary: 'Update a proposal template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' }, ...errorResponses },
    },
    delete: {
      tags: ['Templates'],
      summary: 'Delete a proposal template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Deleted' }, ...errorResponses },
    },
  },

  '/api/proposal-templates/{id}/toggle': {
    post: {
      tags: ['Templates'],
      summary: 'Toggle template active status',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Toggled' }, ...errorResponses },
    },
  },

  '/api/proposal-templates/{id}/restore': {
    post: {
      tags: ['Templates'],
      summary: 'Restore a deleted template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Restored' }, ...errorResponses },
    },
  },

  '/api/email-templates': {
    get: {
      tags: ['Templates'],
      summary: 'Get all email templates',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/EmailTemplate' } },
            },
          },
        },
        ...errorResponses,
      },
    },
    post: {
      tags: ['Templates'],
      summary: 'Create an email template',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'subject', 'body'],
              properties: {
                name: { type: 'string' },
                subject: { type: 'string' },
                body: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Created' }, ...errorResponses },
    },
  },

  '/api/email-templates/{id}': {
    get: {
      tags: ['Templates'],
      summary: 'Get an email template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailTemplate' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Templates'],
      summary: 'Update an email template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                subject: { type: 'string' },
                body: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Updated' }, ...errorResponses },
    },
    delete: {
      tags: ['Templates'],
      summary: 'Delete an email template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Deleted' }, ...errorResponses },
    },
  },

  '/api/email-templates/{id}/toggle': {
    post: {
      tags: ['Templates'],
      summary: 'Toggle email template active status',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Toggled' }, ...errorResponses },
    },
  },

  '/api/email-templates/{id}/restore': {
    post: {
      tags: ['Templates'],
      summary: 'Restore a deleted email template',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Restored' }, ...errorResponses },
    },
  },

  // ============================================
  // EMAILS
  // ============================================
  '/api/emails/send': {
    post: {
      tags: ['Templates'],
      summary: 'Send an email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['to', 'subject', 'body'],
              properties: {
                to: { type: 'string', format: 'email' },
                subject: { type: 'string' },
                body: { type: 'string' },
                templateId: { type: 'string' },
                variables: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Email sent' },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // SETTINGS
  // ============================================
  '/api/settings': {
    get: {
      tags: ['Settings'],
      summary: 'Get user settings',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Settings' },
            },
          },
        },
        ...errorResponses,
      },
    },
    put: {
      tags: ['Settings'],
      summary: 'Update user settings',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                notifications: { type: 'object' },
                integrations: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated' },
        ...errorResponses,
      },
    },
  },

  '/api/settings/test/{service}': {
    post: {
      tags: ['Settings'],
      summary: 'Test an integration',
      parameters: [
        {
          name: 'service',
          in: 'path',
          required: true,
          description: 'Service to test',
          schema: {
            type: 'string',
            enum: ['email', 'whatsapp', 'calcom'],
          },
        },
      ],
      responses: {
        200: { description: 'Test completed' },
        ...errorResponses,
      },
    },
  },

  '/api/settings/test/proposal-notification': {
    post: {
      tags: ['Settings'],
      summary: 'Test proposal notification',
      responses: {
        200: { description: 'Test sent' },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // USERS / SESSIONS
  // ============================================
  '/api/users/sessions': {
    get: {
      tags: ['Users'],
      summary: 'Get current user sessions',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    created: { type: 'string', format: 'date-time' },
                    lastSeen: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/sessions': {
    get: {
      tags: ['Users'],
      summary: 'List all sessions (admin)',
      responses: {
        200: {
          description: 'Successful',
          content: {
            'application/json': {
              schema: { type: 'array', items: { type: 'object' } },
            },
          },
        },
        ...errorResponses,
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete a session',
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Deleted' }, ...errorResponses },
    },
  },

  // ============================================
  // CRON
  // ============================================
  '/api/cron/send-reminders': {
    post: {
      tags: ['Cron'],
      summary: 'Send appointment reminders',
      description: 'Scheduled task to send 24h and 2h appointment reminders.',
      security: [{ api_key: [] }],
      responses: {
        200: {
          description: 'Reminders sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  sent: { type: 'number' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/cron/process-sequence': {
    post: {
      tags: ['Cron'],
      summary: 'Process pending sequence steps',
      description: 'Scheduled task to execute due sequence steps.',
      security: [{ api_key: [] }],
      responses: {
        200: {
          description: 'Steps processed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  processed: { type: 'number' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  // ============================================
  // OTHER
  // ============================================
  '/api/unsubscribe': {
    get: {
      tags: ['Campaigns'],
      summary: 'Unsubscribe from campaigns (public link)',
      description: 'Public endpoint for unsubscribe links in emails.',
      parameters: [
        { name: 'token', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Unsubscribed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },

  '/api/setup/settings': {
    post: {
      tags: ['Settings'],
      summary: 'Initial setup (one-time)',
      description: 'Create initial admin user and settings.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Setup complete',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  user: { type: 'object' },
                },
              },
            },
          },
        },
        ...errorResponses,
      },
    },
  },
};
