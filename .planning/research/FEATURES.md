# Feature Landscape

**Domain:** Lead CRM & Marketing Automation Platform
**Researched:** 2026-03-01
**Focus:** Lead qualification and nurturing via WhatsApp and Email

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Lead CRUD Operations** | Basic data management | Low | Create, Read, Update, Delete leads with validation |
| **Lead Search & Filtering** | Users need to find leads quickly | Medium | Full-text search, multi-criteria filters, saved searches |
| **Lead Notes & Timeline** | Complete interaction history | Low | Notes, activities, communication log in chronological view |
| **Tags & Labels** | Lead categorization | Low | Custom tags for segmentation, visual indicators |
| **Lead Scoring** | Prioritize follow-up efforts | Medium | Numeric scoring based on criteria, weighted factors |
| **Lead Status Workflow** | Track qualification progress | Medium | Customizable statuses (New, Contacted, Qualified, Converted, Lost) |
| **QA Question Management** | Structured qualification | Medium | Define questions, answer options, point values |
| **Email Sending** | Basic communication | Low | Individual emails, templates, basic tracking |
| **WhatsApp Integration** | Primary channel for this CRM | High | Message sending, receiving, webhook handling |
| **Appointment Booking** | Schedule meetings | Medium | Cal.com integration, availability management |
| **Basic Reporting** | Track performance | Medium | Lead counts, conversion rates, source attribution |
| **User Authentication** | Security baseline | Low | Login, logout, password management |
| **Basic Roles** | Access control | Low | Admin vs Standard user permissions |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **WhatsApp-First CRM** | Native WhatsApp workflows vs email-first CRMs | High | Most CRMs treat WhatsApp as add-on; this is core |
| **Interactive Q&A Scoring** | Automated qualification via conversation | Medium | Chatbot-like flow that scores responses automatically |
| **Multi-Channel Sequences** | Nurture across WhatsApp + Email | High | Orchestrate campaigns across both channels intelligently |
| **PocketBase Per-Tenant** | True data isolation with lightweight stack | Medium | Each customer gets isolated DB instance, shared infrastructure |
| **White-Label Branding** | Resellers can customize completely | High | Custom domains, logos, colors, emails |
| **Visual Campaign Builder** | No-code sequence creation | High | Drag-and-drop workflow for drip campaigns |
| **Behavior-Based Triggers** | Respond to lead actions | Medium | Trigger sequences based on link clicks, responses, etc. |
| **Predictive Lead Scoring** | AI-enhanced qualification | High | Machine learning to improve scoring accuracy over time |
| **Omnichannel Inbox** | Unified communication view | Medium | WhatsApp, Email, SMS in one threaded conversation view |
| **Appointment Automation** | Full scheduling workflow | Medium | Booking, confirmation, reminders, follow-ups automated |
| **Funnel Analytics** | Visual conversion tracking | High | Multi-stage funnel with drop-off analysis |
| **Campaign ROI Tracking** | Measure nurturing effectiveness | High | Revenue attribution to specific campaigns/sequences |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Traditional Sales Pipelines** | Focus is on lead nurturing, not complex deal stages | Simple status workflow (New → Qualified → Booking → Customer/Lost) |
| **Full Email Marketing Suite** | Over-engineering for lead nurturing use case | Simple email sequences via API/SendGrid/Mailgun |
| **Social Media Management** | Out of scope for lead CRM | Focus on channels that convert (WhatsApp, Email) |
| **Complex Account hierarchies** | B2C/SMB focus, not enterprise B2B | Simple lead records, contact-centric |
| **Built-in Phone/VOIP** | Infrastructure heavy, low ROI | Integrate with existing tools or skip |
| **Advanced Forecasting** | Premature for early-stage product | Basic conversion tracking sufficient |
| **Mobile Apps (iOS/Android)** | Web-first approach faster, PWA sufficient | Responsive web app with PWA capabilities |
| **Custom Objects/Automation** | Complexity trap, hard to maintain | Fixed schema for leads, campaigns, sequences |
| **Multi-Currency/Multi-Language** | Premature globalization | Single language/currency initially |
| **Advanced Permission System** | Over-engineering for typical use case | Simple roles (Admin, Sales, Viewer) |

## Feature Dependencies

```
Core Lead Management
├── Lead CRUD (foundational)
├── Search & Filtering (requires CRUD)
├── Tags & Notes (requires CRUD)
└── Lead Scoring (requires CRUD, tags)

Qualification System
├── QA Questions (foundational)
├── Lead Scoring (requires QA Questions)
└── Status Workflows (requires Scoring)

Communication
├── Email Sending (foundational)
├── WhatsApp Integration (foundational)
└── Omnichannel Inbox (requires Email + WhatsApp)

Campaign Management
├── Sequences (requires Communication channels)
├── Visual Campaign Builder (requires Sequences)
└── Behavior Triggers (requires Sequences, Analytics)

Appointments
├── Cal.com Integration (foundational)
└── Automation (requires Integration)

Analytics
├── Basic Reporting (requires Lead Management)
├── Funnel Analytics (requires Basic Reporting)
└── Campaign ROI (requires Sequences + Basic Reporting)

Multi-Tenant
├── White-Label Branding (foundational)
├── User Management (foundational)
└── Role-Based Access (requires User Management)
```

## MVP Recommendation

For MVP, prioritize:

**Phase 1 - Core Lead Management (Table Stakes)**
1. Lead CRUD with validation
2. Lead search and filtering
3. Tags and basic notes
4. Simple lead scoring (manual or rule-based)
5. Basic status workflow

**Phase 2 - WhatsApp & Qualification (Differentiator)**
1. WhatsApp integration (send/receive/webhooks)
2. QA question builder
3. WhatsApp Q&A flow with scoring
4. Lead status automation based on score

**Phase 3 - Appointments & Nurturing (Table Stakes + Differentiator)**
1. Cal.com integration
2. Appointment booking automation
3. Basic email sequences
4. Simple WhatsApp drip campaigns

**Phase 4 - Multi-Tenant Foundation (Table Stakes)**
1. User authentication and roles
2. Basic white-label branding (logo, colors)
3. Tenant onboarding

Defer to post-MVP:
- **Visual Campaign Builder**: Start with simple sequence builder
- **Advanced Analytics**: Basic reporting sufficient initially
- **Predictive Lead Scoring**: Rule-based scoring sufficient for MVP
- **Full White-Label Domains**: Start with subdomains
- **Mobile Apps**: Responsive web + PWA

## Feature Categories by Domain

### 1. Lead Management

**Table Stakes:**
- CRUD operations with validation
- Search (full-text, filters)
- Notes and activity timeline
- Tags/labels for segmentation
- Bulk operations (export, delete, tag)

**Differentiators:**
- WhatsApp-native lead profiles
- Automated lead enrichment from WhatsApp conversations
- Smart duplicate detection with merge suggestions

**Complexity:** Low-Medium
**Dependencies:** None (foundational)

### 2. Lead Qualification

**Table Stakes:**
- Manual lead scoring
- Customizable qualification questions
- Status workflow (New → Qualified → Lost)
- Score threshold automation

**Differentiators:**
- Interactive WhatsApp Q&A flows
- Real-time scoring updates during conversation
- AI-suggested qualification questions based on industry

**Complexity:** Medium-High
**Dependencies:** Lead Management, WhatsApp Integration

### 3. Communication Channels

**Table Stakes:**
- Email sending (individual + templates)
- WhatsApp message sending
- Basic message tracking (sent, delivered)
- Template library

**Differentiators:**
- Omnichannel threaded inbox (WhatsApp + Email unified)
- Smart channel selection (auto-choose best channel)
- Message optimization suggestions (timing, content)

**Complexity:** Medium
**Dependencies:** Lead Management

### 4. Campaign Management

**Table Stakes:**
- Create email/WhatsApp campaigns
- Basic audience segmentation
- Schedule campaigns
- Campaign performance tracking

**Differentiators:**
- Cross-channel campaign orchestration
- Visual workflow builder for sequences
- Behavior-based triggers and branching
- A/B testing capabilities

**Complexity:** High
**Dependencies:** Communication Channels, Lead Management, Analytics

### 5. Nurturing Sequences

**Table Stakes:**
- Linear drip campaigns
- Time-based triggers
- Basic personalization (name, company)
- Sequence performance metrics

**Differentiators:**
- Multi-channel sequences (WhatsApp + Email mix)
- Conditional branching based on engagement
- Dynamic content blocks
- Smart timing optimization

**Complexity:** High
**Dependencies:** Campaign Management, Analytics

### 6. Appointments (Cal.com)

**Table Stakes:**
- Cal.com integration
- Booking link generation
- Availability management
- Basic confirmations

**Differentiators:**
- Intelligent appointment reminders (WhatsApp + Email)
- Automated pre-meeting qualification
- Post-meeting follow-up automation
- Calendar conflict resolution across team

**Complexity:** Medium
**Dependencies:** Lead Management, Communication Channels

### 7. Reporting & Analytics

**Table Stakes:**
- Lead source tracking
- Conversion rate by status
- Basic funnel visualization
- Campaign performance metrics
- Export to CSV

**Differentiators:**
- Real-time funnel with cohort analysis
- Revenue attribution modeling
- Predictive analytics for lead conversion
- Custom dashboard builder
- Advanced cohort and retention analysis

**Complexity:** High
**Dependencies:** All feature areas

### 8. User Management

**Table Stakes:**
- User authentication
- Basic roles (Admin, User, Viewer)
- User profile management
- Activity audit log

**Differentiators:**
- Team-based permissions
- Granular permission controls per feature
- SSO integration (SAML, OAuth)
- User activity analytics

**Complexity:** Medium
**Dependencies:** Multi-Tenant Architecture

### 9. Multi-Tenant / White-Label

**Table Stakes:**
- Tenant isolation
- Basic branding (logo, colors, name)
- Subdomain per tenant
- Tenant onboarding flow

**Differentiators:**
- Custom domain mapping
- Full CSS customization
- White-label email templates
- Tenant-specific automation rules
- API keys per tenant

**Complexity:** High
**Dependencies:** User Management, Core Architecture

### 10. Integrations

**Table Stakes:**
- n8n webhook integration
- Basic REST API
- Webhooks for lead events
- Import/export CSV

**Differentiators:**
- Native integrations (HubSpot, Salesforce sync)
- Zapier/Make.com connectors
- API rate limiting and quotas
- Webhook replay capabilities
- Integration marketplace

**Complexity:** Medium-High
**Dependencies:** Lead Management, Architecture

## Complexity Notes

**Low Complexity (1-2 weeks):**
- Basic CRUD, search, tags
- Simple email sending
- User auth and basic roles
- Import/export

**Medium Complexity (3-6 weeks):**
- WhatsApp integration
- Lead scoring and workflows
- Cal.com integration
- Basic reporting
- Sequences without visual builder

**High Complexity (8-12+ weeks):**
- Visual campaign builder
- Cross-channel orchestration
- Advanced analytics and attribution
- Full white-label with custom domains
- Multi-tenant architecture optimization

## Risk Areas

1. **WhatsApp API Rate Limits**: Need robust queue management and retry logic
2. **Multi-Tenant Performance**: PocketBase per-tenant needs careful resource management
3. **Cal.com Reliability**: Appointment booking is critical - need fallback handling
4. **Email Deliverability**: Need proper SPF/DKIM setup, bounce handling
5. **Data Privacy**: GDPR compliance for lead data, especially in EU

## Sources

- Zoho CRM & Campaigns - Email automation features (HIGH confidence)
- ActiveCampaign - Behavioral triggers and automation (MEDIUM confidence)
- HubSpot/Salesforce - Lead management industry standards (HIGH confidence)
- Cal.com - Official documentation and integrations (HIGH confidence)
- WhatsApp Business API - Official capabilities and limitations (HIGH confidence)
- CRM market analysis 2026 - Industry trends and table stakes (MEDIUM confidence)
- White-label SaaS patterns - Multi-tenant best practices (MEDIUM confidence)
