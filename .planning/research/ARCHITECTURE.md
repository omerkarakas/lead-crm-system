# Architecture Patterns

**Domain:** Lead CRM & Marketing Automation Platform
**Project:** Moka CRM
**Researched:** 2026-03-01
**Overall confidence:** HIGH

## System Overview

Moka CRM is a multi-instance, self-hosted CRM and marketing automation platform where each customer receives their own isolated PocketBase instance. The system orchestrates lead management through automated qualification, appointment scheduling, and multi-channel nurturing.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOKA CRM - SYSTEM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   LEAD       │         │   CUSTOMER   │         │    ADMIN     │        │
│  │   INSTANCE   │         │   INSTANCE   │         │   PANEL      │        │
│  │              │         │              │         │              │        │
│  │ ┌──────────┐ │         │ ┌──────────┐ │         │ ┌──────────┐ │        │
│  │ │PocketBase│ │         │ │PocketBase│ │         │ │PocketBase│ │        │
│  │ │  + API   │ │         │ │  + API   │ │         │ │  + API   │ │        │
│  │ └────┬─────┘ │         │ └────┬─────┘ │         │ └────┬─────┘ │        │
│  │      │       │         │      │       │         │      │       │        │
│  │ ┌────▼─────┐ │         │ ┌────▼─────┐ │         │ ┌────▼─────┐ │        │
│  │ │   CRM    │ │         │ │   CRM    │ │         │ │  ADMIN   │ │        │
│  │ │    UI    │ │         │ │    UI    │ │         │ │   UI     │ │        │
│  │ └──────────┘ │         │ └──────────┘ │         │ └──────────┘ │        │
│  └──────┬───────┘         └──────┬───────┘         └──────┬───────┘        │
│         │                        │                        │                │
│         │                        │                        │                │
│         └────────────────────────┼────────────────────────┘                │
│                                  │                                         │
│                                  ▼                                         │
│                    ┌─────────────────────────┐                             │
│                    │       n8n HUB           │                             │
│                    │   (Automation Engine)   │                             │
│                    │                         │                             │
│                    │  ┌─────────────────┐   │                             │
│                    │  │  Lead QA        │   │                             │
│                    │  │  Workflows      │   │                             │
│                    │  └─────────────────┘   │                             │
│                    │  ┌─────────────────┐   │                             │
│                    │  │  Nurturing      │   │                             │
│                    │  │  Sequences      │   │                             │
│                    │  └─────────────────┘   │                             │
│                    │  ┌─────────────────┐   │                             │
│                    │  │  Appointment    │   │                             │
│                    │  │  Reminders      │   │                             │
│                    │  └─────────────────┘   │                             │
│                    └───────────┬─────────────┘                             │
│                                │                                         │
│         ┌──────────────────────┼──────────────────────┐                  │
│         │                      │                      │                  │
│         ▼                      ▼                      ▼                  │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐               │
│  │  Green   │          │  Resend  │          │  Cal.com │               │
│  │   API    │          │ (Email)  │          │(Calendar)│               │
│  │(WhatsApp)│          │          │          │          │               │
│  └──────────┘          └──────────┘          └──────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Customer CRM UI** | Lead management, qualification viewing, appointment scheduling, campaign management | Customer PocketBase API, n8n webhooks |
| **Admin Management Panel** | Customer instance provisioning, health monitoring, white-label configuration, user management across all instances | Admin PocketBase API, Customer PocketBase APIs (via management endpoints) |
| **PocketBase Instance (per customer)** | Data persistence, real-time subscriptions, authentication, CRUD operations, hooks for automation triggers | CRM UI, Admin Panel (for management), n8n workflows |
| **n8n Automation Engine** | Workflow orchestration, lead qualification logic, nurturing sequences, appointment reminders, external service integrations | All PocketBase instances (via API), Green API, Resend, Cal.com |
| **Integration Layer** | External service adapters, rate limiting, message queue management, error handling | n8n workflows, external APIs (Green API, Resend, Cal.com) |

## Data Flow

### Complete Lead Journey Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LEAD DATA FLOW PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LEAD CAPTURE                                                            │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Web Form / API / Manual Entry → PocketBase:leads collection     │     │
│     │                                                                 │     │
│     │ Stored: {name, email, phone, source, status, score, created_at}│     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  2. TRIGGER AUTOMATION                                                     │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ PocketBase hook → n8n webhook: "lead_created"                   │     │
│     │                                                                 │     │
│     │ Payload: {lead_id, customer_instance_id, contact_info}          │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  3. QUALIFICATION (WhatsApp QA)                                            │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ n8n workflow: QA Sequence                                       │     │
│     │  ├─ Fetch qualification questions from PocketBase               │     │
│     │  ├─ Send question via Green API (WhatsApp)                     │     │
│     │  ├─ Receive answer via webhook                                 │     │
│     │  ├─ Calculate lead score based on answers                      │     │
│     │  ├─ Update lead in PocketBase with score & answers             │     │
│     │  └─ Route based on score threshold                             │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│           HIGH SCORE (≥ threshold)        LOW SCORE (< threshold)            │
│                    │                               │                        │
│                    ▼                               ▼                        │
│  4a. APPOINTMENT FLOW                4b. NURTURING FLOW                      │
│     ┌─────────────────────────┐     ┌─────────────────────────┐             │
│     │ n8n: Send Cal.com link  │     │ n8n: Nurturing Sequence │             │
│     │ via WhatsApp            │     │ ├─ Email sequence       │             │
│     │ ├─ Create booking link  │     │ ├─ WhatsApp drips       │             │
│     │ └─ Set reminders        │     │ └─ Re-qualification     │             │
│     └───────────┬─────────────┘     └───────────┬─────────────┘             │
│                 │                               │                            │
│                 ▼                               ▼                            │
│  5a. APPOINTMENT BOOKED            5b. LEAD RE-QUALIFIED                   │
│     ┌─────────────────────────┐     ┌─────────────────────────┐             │
│     │ Cal.com webhook → n8n   │     │ Score improved → Route │             │
│     │ ├─ Update lead status   │     │ back to step 3 or 4a   │             │
│     │ ├─ Notify sales team    │     │                         │             │
│     │ └─ Schedule follow-ups  │     │                         │             │
│     └───────────┬─────────────┘     └─────────────────────────┘             │
│                 │                                                         │
│                 ▼                                                         │
│  6. SALES ENGAGEMENT                                                      │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Sales team uses CRM UI to:                                     │     │
│     │  ├─ View qualified leads and appointments                      │     │
│     │  ├─ Add notes and interaction history                          │     │
│     │  ├─ Update lead status (contacted, met, proposal, closed)      │     │
│     │  └─ Trigger handoff workflows via n8n                          │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Direction

```
EXTERNAL → POCKETBASE → N8N → EXTERNAL SERVICES
    ↓           ↓         ↓            ↓
  Web Form    Store    Process    WhatsApp/Email
  API Call     Data     Logic        Calendar
    ↓           ↓         ↓            ↓
         PocketBase → CRM UI → User
              Real-time
              Subscriptions
```

**Flow Rules:**
1. **Inbound:** External sources → PocketBase (single source of truth)
2. **Processing:** PocketBase hooks → n8n workflows (event-driven)
3. **Outbound:** n8n → External APIs (Green API, Resend, Cal.com)
4. **UI Updates:** PocketBase real-time → CRM UI (WebSocket subscriptions)
5. **Admin:** Admin Panel → Customer Instances (management operations only)

## Multi-Instance Architecture

### Instance Provisioning Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER INSTANCE PROVISIONING                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NEW CUSTOMER SIGNUP                                                     │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Admin Panel: Create new customer                                 │     │
│     │ Input: {company_name, subdomain, plan, admin_user}              │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  2. PROVISION INFRASTRUCTURE                                              │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ a) Create unique instance ID: {tenant_id}                       │     │
│     │ b) Create subdomain: {subdomain}.crm.mokadijital.com            │     │
│     │ c) Docker compose:                                              │     │
│     │    - pocketbase-{tenant_id} container                           │     │
│     │    - Volume: pb_data_{tenant_id}                                │     │
│     │    - Port: 809X (incremental)                                   │     │
│     │ d) Initialize PocketBase with schema                             │     │
│     │ e) Create admin user in instance                                 │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  3. CONFIGURE ROUTING                                                    │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Update reverse proxy (Nginx/Traefik):                           │     │
│     │                                                                 │     │
│     │ {subdomain}.crm.mokadijital.com → localhost:809X                │     │
│     │                                                                 │     │
│     │ Configure SSL certificate (Let's Encrypt wildcard)              │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  4. SETUP AUTOMATION                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ a) Create n8n credential for customer instance                   │     │
│     │    - URL: https://{subdomain}.crm.mokadijital.com/api           │     │
│     │    - Admin API token                                            │     │
│     │ b) Duplicate n8n workflow templates with instance credentials    │     │
│     │ c) Configure external service credentials:                      │     │
│     │    - Green API instance ID/token                                │     │
│     │    - Resend API key (or customer's own)                         │     │
│     │    - Cal.com organization/user                                  │     │
│     └──────────────────────────────┬──────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│  5. WHITE-LABEL CONFIGURATION                                            │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Store customer branding in Admin Panel:                         │     │
│     │ {logo_url, primary_color, secondary_color, email_from_name}     │     │
│     │                                                                 │     │
│     │ CRM UI fetches branding on load from Admin Panel API            │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA ISOLATION PER CUSTOMER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Customer A Instance                Customer B Instance                     │
│  ┌─────────────────────────┐       ┌─────────────────────────┐             │
│  │ pocketbase-cust-a       │       │ pocketbase-cust-b       │             │
│  │ Port: 8091              │       │ Port: 8092              │             │
│  │ Volume: pb_data_cust_a  │       │ Volume: pb_data_cust_b  │             │
│  │                         │       │                         │             │
│  │ Collections:            │       │ Collections:            │             │
│  │ - leads                 │       │ - leads                 │             │
│  │ - questions             │       │ - questions             │             │
│  │ - answers               │       │ - answers               │             │
│  │ - appointments          │       │ - appointments          │             │
│  │ - messages              │       │ - messages              │             │
│  │ - campaigns             │       │ - campaigns             │             │
│  │ - sequences             │       │ - sequences             │             │
│  │ - users                 │       │ - users                 │             │
│  └─────────────────────────┘       └─────────────────────────┘             │
│         │                                   │                               │
│         │                                   │                               │
│         └─────────────┬─────────────────────┘                               │
│                       │                                                     │
│                       ▼                                                     │
│           ┌─────────────────────────────┐                                   │
│           │   ADMIN PANEL INSTANCE      │                                   │
│           │   (Meta-data only)          │                                   │
│           │                             │                                   │
│           │ Collections:                │                                   │
│           │ - customers                 │                                   │
│           │ - instances                 │                                   │
│           │ - subscriptions             │                                   │
│           │ - system_health             │                                   │
│           │                             │                                   │
│           │ NO LEAD DATA STORED HERE    │                                   │
│           └─────────────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Isolation Guarantees:**
1. **Database:** Complete separation - each customer has their own SQLite file
2. **Application:** Separate PocketBase process per customer
3. **Network:** Separate ports and subdomains
4. **Credentials:** Unique API tokens per instance
5. **Backups:** Individual backup/restore per customer
6. **Resource Limits:** Docker container resource constraints possible

## Deployment Architecture

### Docker Compose Structure

```yaml
# docker-compose.yml structure
services:
  # Reverse Proxy & SSL
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on: [pocketbase-admin, pocketbase-customers]
    restart: always

  # Admin Panel
  pocketbase-admin:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pb-admin
    ports: ["8090:8090"]
    volumes:
      - pb_admin_data:/pb_data
      - ./admin/pb_hooks:/pb_hooks
    environment:
      - POCKETBASE_ENCRYPTION_KEY=${ADMIN_ENCRYPTION_KEY}
    restart: always

  # Customer Instances (example)
  pocketbase-customer-a:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pb-customer-a
    ports: ["8091:8090"]
    volumes:
      - pb_customer_a_data:/pb_data
      - ./customers/a/pb_hooks:/pb_hooks
    environment:
      - POCKETBASE_ENCRYPTION_KEY=${CUSTOMER_A_ENCRYPTION_KEY}
    restart: always

  pocketbase-customer-b:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pb-customer-b
    ports: ["8092:8090"]
    volumes:
      - pb_customer_b_data:/pb_data
      - ./customers/b/pb_hooks:/pb_hooks
    environment:
      - POCKETBASE_ENCRYPTION_KEY=${CUSTOMER_B_ENCRYPTION_KEY}
    restart: always

  # n8n Automation Hub
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    ports: ["5678:5678"]
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/workflows:/workflows
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - WEBHOOK_URL=https://automation.mokadijital.com
    restart: always

volumes:
  pb_admin_data:
  pb_customer_a_data:
  pb_customer_b_data:
  n8n_data:
```

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NETWORK LAYOUT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INTERNET                                                                   │
│    │                                                                        │
│    ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    NGINX REVERSE PROXY                          │       │
│  │                    (Port 80/443)                                │       │
│  │                                                                 │       │
│  │  Routes:                                                        │       │
│  │  - admin.mokadijital.com    → pb-admin:8090                     │       │
│  │  - customer-a.crm.*         → pb-customer-a:8091                │       │
│  │  - customer-b.crm.*         → pb-customer-b:8092                │       │
│  │  - automation.mokadijital.com → n8n:5678                        │       │
│  │                                                                 │       │
│  │  SSL: Let's Encrypt wildcard cert for *.mokadijital.com        │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│    │                       │                        │                       │
│    ▼                       ▼                        ▼                       │
│  ┌──────────┐        ┌──────────┐           ┌──────────┐                   │
│  │   Admin  │        │ Customer │           │   n8n    │                   │
│  │   Panel  │        │ Instances│           │  Hub     │                   │
│  │  :8090   │        │ :8091+   │           │  :5678   │                   │
│  └──────────┘        └──────────┘           └──────────┘                   │
│                                                                             │
│  Internal Docker Network (moka-crm-network)                                │
│  - All services on same network for internal communication                 │
│  - n8n can reach all PocketBase instances via container DNS                │
│  - Admin panel can reach customer instances for management                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Security Considerations

### API Key & Credential Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SECURITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CUSTOMER INSTANCE AUTH                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ PocketBase Built-in Auth:                                      │     │
│     │ - Email/password authentication for users                      │     │
│     │ - Role-based access (admin, sales, marketing)                  │     │
│     │ - API tokens for automation (n8n credentials)                  │     │
│     │                                                                 │     │
│     │ Collection Rules:                                               │     │
│     │ - leads: Sales+Marketing can read, Admin can write             │     │
│     │ - users: Admin only                                            │     │
│     │ - campaigns: Marketing+ can manage                             │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  2. ADMIN PANEL AUTH                                                       │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ - Mokadijital staff only (super admins)                         │     │
│     │ - 2FA required                                                  │     │
│     │ - IP whitelisting (optional)                                   │     │
│     │ - Audit logging for all management actions                     │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  3. N8N CREDENTIALS STORE                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ - Encrypted credential store                                    │     │
│     │ - Separate credential per customer instance:                    │     │
│     │   └─ PocketBase API endpoint + admin token                     │     │
│     │ - External service credentials:                                 │     │
│     │   ├─ Green API (per customer or shared pool)                   │     │
│     │   ├─ Resend API (customer's key or Moka's)                     │     │
│     │   └─ Cal.com (per customer organization)                       │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  4. DATA ISOLATION ENFORCEMENT                                              │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ - Physical separation: Different SQLite files                   │     │
│     │ - Network separation: Different subdomains                      │     │
│     │ - Process separation: Different containers                      │     │
│     │ - No cross-instance queries possible                            │     │
│     │ - n8n workflows explicitly scoped to single instance            │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  5. EXTERNAL API SECURITY                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ Green API (WhatsApp):                                           │     │
│     │ - Rate limiting per instance                                    │     │
│     │ - Message template approval (WhatsApp policy)                   │     │
│     │ - Opt-out handling                                              │     │
│     │                                                                 │     │
│     │ Resend (Email):                                                  │     │
│     │ - SPF/DKIM setup for customer domains                           │     │
│     │ - Unsubscribe handling required                                 │     │
│     │ - Rate limiting per campaign                                    │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## PocketBase Data Model (Per Customer Instance)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POCKETBASE COLLECTIONS STRUCTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  leads (Core entity)                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id, name, email, phone, source, status, score, created_at,        │    │
│  │ assigned_to, last_contacted_at, converted_at                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                │                                            │
│                                │                                            │
│  ┌─────────────────────────────┼─────────────────────────────┐              │
│  ▼                             ▼                             ▼              │
│  ┌─────────────┐       ┌─────────────┐         ┌─────────────┐              │
│  │ answers     │       │appointments │         │ messages    │              │
│  ├─────────────┤       ├─────────────┤         ├─────────────┤              │
│  │ id          │       │ id          │         │ id          │              │
│  │ lead_id     │       │ lead_id     │         │ lead_id     │              │
│  │ question_id │       │ cal_event_id│         │ channel     │              │
│  │ answer      │       │ scheduled_at│         │ direction   │              │
│  │ score_impact│       │ status      │         │ content     │              │
│  │ answered_at │       │ reminded_at │         │ sent_at     │              │
│  └─────────────┘       └─────────────┘         └─────────────┘              │
│                                                                             │
│  questions (QA configuration)                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id, text, order, answer_type, scoring_rules, active               │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  campaigns (Marketing campaigns)                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id, name, type, status, lead_source, sequence_id, stats           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                │                                            │
│                                ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ sequences                                                           │    │
│  │ ├──────────────────────────────────────────────────────────────────┤    │
│  │ │ id, name, trigger_condition, status, steps (JSON)               │    │
│  │ └──────────────────────────────────────────────────────────────────┘    │
│  │                                                                         │
│  │ steps structure:                                                        │
│  │ [{                                                                      │
│  │   order: 1,                                                            │
│  │   type: "email" | "whatsapp" | "delay",                                │
│  │   channel: "resend" | "green_api",                                     │
│  │   template_id: "...",                                                  │
│  │   delay_hours: 24                                                      │
│  │ }]                                                                      │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  users (RBAC)                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id, email, name, role, avatar, active, last_login                 │    │
│  │                                                                 │    │
│  │ Roles: admin, sales, marketing                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  settings (Customer configuration)                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id, key, value                                                       │    │
│  │                                                                       │    │
│  │ Keys:                                                                 │    │
│  │ - qualification_score_threshold                                       │    │
│  │ - default_lead_assignment                                            │    │
│  │ - branding_logo_url                                                  │    │
│  │ - branding_colors                                                    │    │
│  │ - whatsapp_business_number                                           │    │
│  │ - email_from_address                                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## n8n Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       N8N WORKFLOW PATTERNS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Workflow 1: Lead Qualification (QA)                                       │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: PocketBase hook (on lead create)                          │    │
│  │                                                                 │    │
│  │ 1. Fetch active questions from PocketBase                         │    │
│  │ 2. For each question:                                              │    │
│  │    a. Send via Green API (WhatsApp)                                │    │
│  │    b. Wait for answer webhook                                      │    │
│  │    c. Store answer in PocketBase:answers                           │    │
│  │    d. Calculate cumulative score                                   │    │
│  │ 3. Update lead with final score                                     │    │
│  │ 4. Route based on score threshold                                   │    │
│  │    └─ High: Trigger appointment workflow                           │    │
│  │    └─ Low: Trigger nurturing workflow                               │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Workflow 2: Appointment Scheduling                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: Lead qualified (high score)                                │    │
│  │                                                                 │    │
│  │ 1. Generate Cal.com booking link                                   │    │
│  │ 2. Send link via WhatsApp (Green API)                              │    │
│  │ 3. Monitor for Cal.com webhook (booking confirmed)                 │    │
│  │ 4. On booking:                                                      │    │
│  │    a. Create appointment in PocketBase                             │    │
│  │    b. Update lead status                                            │    │
│  │    c. Schedule reminder (1hr before)                                │    │
│  │    d. Notify sales team (Slack/Email)                              │    │
│  │ 5. After appointment: Follow-up sequence                            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Workflow 3: Lead Nurturing Sequence                                       │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: Lead score < threshold OR no booking in 7 days            │    │
│  │                                                                 │    │
│  │ Fetch sequence steps from PocketBase                               │    │
│  │ For each step in sequence:                                         │    │
│  │   If type == "delay":                                              │    │
│  │     Wait specified hours                                           │    │
│  │   If type == "email":                                              │    │
│  │     Send via Resend using template                                 │    │
│  │     Log to PocketBase:messages                                     │    │
│  │   If type == "whatsapp":                                           │    │
│  │     Send via Green API                                             │    │
│  │     Log to PocketBase:messages                                     │    │
│  │   Check for re-qualification trigger (response)                    │    │
│  │     └─ If engaged: Route back to QA workflow                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Workflow 4: Daily Maintenance                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: Cron (daily 9 AM)                                         │    │
│  │                                                                 │    │
│  │ 1. Find leads needing follow-up (no contact in 3 days)             │    │
│  │ 2. Send reminders to assigned sales users                          │    │
│  │ 3. Calculate daily stats (new leads, qualified, booked)            │    │
│  │ 4. Send digest to marketing team                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Workflow 5: Campaign Execution                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Trigger: Manual OR scheduled launch                                │    │
│  │                                                                 │    │
│  │ 1. Fetch campaign config from PocketBase                           │    │
│  │ 2. Query leads matching criteria                                   │    │
│  │ 3. Bulk add leads to nurturing sequence                            │    │
│  │ 4. Monitor campaign metrics (opens, clicks, responses)             │    │
│  │ 5. Update campaign stats in PocketBase                             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Suggested Build Order

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Core infrastructure and single customer instance

```
Priority 1: Infrastructure Setup
├─ Docker compose environment
├─ Nginx reverse proxy with SSL
├─ Base PocketBase configuration
└─ Admin Panel (basic customer CRUD)

Priority 2: PocketBase Schema
├─ Define all collections (leads, users, questions, etc.)
├─ Set up collection rules (RBAC)
├─ Configure indexes for performance
└─ Set up hooks for automation triggers

Priority 3: Basic CRM UI
├─ Lead list and detail views
├─ User authentication (PocketBase auth)
└─ Basic CRUD operations
```

**Why this order:**
- Infrastructure first - nothing works without it
- Schema before UI - data structure drives UI
- Single instance before multi - prove the concept

**Dependencies:**
- Phase 2 requires Phase 1 infrastructure
- Phase 3 requires Phase 2 schema

---

### Phase 2: Core Lead Management (Weeks 5-8)
**Goal:** Lead capture and basic qualification

```
Priority 1: Lead Capture
├─ Web form embed component
├─ API endpoint for programmatic creation
├─ Lead list with filtering/sorting
└─ Manual lead entry

Priority 2: Qualification System
├─ Question management in CRM UI
├─ Answer collection interface
├─ Lead scoring calculation
└─ Status updates based on score

Priority 3: n8n Integration - QA Workflow
├─ PocketBase webhook setup
├─ Green API credential configuration
├─ QA question/answer workflow
└─ Answer storage and score calculation
```

**Why this order:**
- Lead capture is the entry point
- Qualification requires leads to exist
- Automation requires manual process first

**Dependencies:**
- Requires Phase 1 PocketBase schema
- Requires Phase 1 basic UI

---

### Phase 3: Appointment Management (Weeks 9-12)
**Goal:** High-score lead conversion

```
Priority 1: Cal.com Integration
├─ OAuth connection setup
├─ Booking link generation
├─ Webhook handling (booking events)
└─ Reminder scheduling

Priority 2: Appointment UI
├─ Calendar view
├─ Appointment detail page
├─ Status management (scheduled, completed, canceled)
└─ Sales notes interface

Priority 3: n8n Integration - Appointment Workflow
├─ Trigger on qualified lead
├─ Send Cal.com link via WhatsApp
├─ Monitor booking webhooks
├─ Create appointment record
└─ Schedule reminders
```

**Why this order:**
- Appointments build on qualification
- Cal.com integration before automation
- UI before workflow complexity

**Dependencies:**
- Requires Phase 2 (qualified leads)

---

### Phase 4: Nurturing & Campaigns (Weeks 13-16)
**Goal:** Low-score lead engagement

```
Priority 1: Email Integration
├─ Resend API setup
├─ Email template management
├─ Campaign creation UI
└─ Email sending with logging

Priority 2: Sequence Builder
├─ Visual step builder
├─ Delay configuration
├─ Channel selection (email/WhatsApp)
└─ Preview and testing

Priority 3: n8n Integration - Nurturing Workflows
├─ Sequence execution engine
├─ Re-qualification triggers
├─ Engagement tracking
└─ Campaign metrics calculation
```

**Why this order:**
- Email is simpler than multi-channel
- Sequences before automation
- Manual campaigns before automated

**Dependencies:**
- Requires Phase 2 (leads exist)
- Requires Phase 3 (appointments working)

---

### Phase 5: Multi-Instance Architecture (Weeks 17-20)
**Goal:** Production multi-customer deployment

```
Priority 1: Instance Provisioning
├─ Automated customer signup
├─ Docker container creation
├─ Subdomain routing
└─ PocketBase initialization

Priority 2: Admin Panel Enhancements
├─ Customer management dashboard
├─ Instance health monitoring
├─ Bulk operations
└─ Usage metrics

Priority 3: Multi-Instance n8n
├─ Credential per instance
├─ Workflow duplication
├─ Instance-specific routing
└─ Cross-instance monitoring

Priority 4: White-Label Features
├─ Custom logo upload
├─ Color scheme configuration
├─ Custom email templates
└─ White-label documentation
```

**Why this order:**
- Single instance must work first
- Provisioning automation before scaling
- White-label last (polish feature)

**Dependencies:**
- Requires all previous phases working
- Requires production infrastructure

---

### Phase 6: Analytics & Reporting (Weeks 21-24)
**Goal:** Business insights and optimization

```
Priority 1: Dashboard Framework
├─ Chart component library
├─ Date range picker
├─ Real-time vs historical toggle
└─ Export functionality

Priority 2: Funnel Analytics
├─ Lead conversion funnel
├─ Stage duration metrics
├─ Drop-off analysis
└─ Source attribution

Priority 3: Campaign Analytics
├─ Open/click rates
├─ Response rates
├─ ROI calculation
└─ A/B testing basics

Priority 4: Sales Performance
├─ Individual sales metrics
├─ Team comparison
├─ Activity tracking
└─ Goal progress
```

**Why this order:**
- Analytics requires data accumulation
- Dashboards before specific reports
- Business metrics before detailed analysis

**Dependencies:**
- Requires Phase 4 (campaigns running)
- Requires Phase 5 (multiple customers)

---

## Build Dependencies Graph

```
                    ┌─────────────────┐
                    │  PHASE 1        │
                    │  Foundation     │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────┐              ┌─────────────────┐
   │  PHASE 2        │              │  (Parallel)     │
   │  Lead Mgmt      │              │  Basic CRM UI   │
   └────────┬────────┘              └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  PHASE 3        │
   │  Appointments   │
   └────────┬────────┘
            │
            ├──────────────────┐
            ▼                  ▼
   ┌─────────────────┐ ┌─────────────────┐
   │  PHASE 4        │ │  (Can start     │
   │  Nurturing      │ │   after P2)     │
   └────────┬────────┘ │  Reporting      │
            │          └─────────────────┘
            ▼
   ┌─────────────────┐
   │  PHASE 5        │
   │  Multi-Instance │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │  PHASE 6        │
   │  Analytics      │
   └─────────────────┘
```

## Scalability Considerations

| Concern | At 10 customers | At 100 customers | At 1000 customers |
|---------|-----------------|------------------|-------------------|
| **PocketBase Instances** | Single Docker host, manual scaling | Docker Swarm or basic K8s, auto-scaling groups | Full K8s cluster with HPA, sharding |
| **Database Performance** | SQLite per instance (fine) | SQLite per instance (monitor slow queries) | Consider PostgreSQL for high-volume customers |
| **n8n Workflows** | Single n8n instance | n8n with queue mode | n8n cluster with Redis queue |
| **Reverse Proxy** | Single Nginx | Nginx with load balancing | Traefik or cloud LB |
| **Storage** | Local volumes | Network storage (NFS) | Cloud storage (S3-compatible) |
| **Backups** | Daily local backup | Hourly local, daily remote | Continuous replication |
| **Monitoring** | Basic health checks | Prometheus + Grafana | Full observability stack |
| **SSL Certificates** | Let's Encrypt wildcard | Let's Encrypt automation | Enterprise SSL |

## Multi-Instance Deployment Considerations

### Provisioning Automation
- **Manual Phase:** Copy-paste docker-compose, manually configure
- **Semi-Auto:** CLI tool to generate configs
- **Fully Auto:** Self-service signup with instant provisioning

### Configuration Management
- **Environment Variables:** Per-instance env files
- **Secrets Management:** HashiCorp Vault or similar (later phases)
- **Configuration Drift:** Git-tracked configs, drift detection

### Updates & Maintenance
- **Rolling Updates:** Update instances one at a time
- **Version Pinning:** Allow customers to stay on older versions
- **Breaking Changes:** Migration scripts and notices

### Resource Allocation
- **Fair Sharing:** CPU/memory limits per container
- **Burst Capacity:** Allow temporary overages
- **Tier-Based Plans:** Different limits per subscription tier

### Disaster Recovery
- **Per-Customer Backups:** Separate backup schedules
- **Instance Restoration:** Test restore process regularly
- **Business Continuity:** HA setup for critical customers

## Sources

### CRM Architecture
- CRM System Component Architecture (Web Search, 2026) - MEDIUM confidence
- Lead Management Funnel Patterns (Web Search, 2026) - MEDIUM confidence

### Multi-Instance SaaS
- Multi-Instance SaaS Architecture (Web Search, 2026) - MEDIUM confidence
- Database Isolation Patterns (Web Search, 2026) - MEDIUM confidence

### PocketBase Deployment
- PocketBase Docker Deployment (Web Search, 2026) - MEDIUM confidence
- Containerization Patterns (Web Search, 2026) - MEDIUM confidence

### n8n Integration
- n8n Automation CRM Patterns (Web Search, 2026) - MEDIUM confidence
- Workflow Orchestration Best Practices (Web Search, 2026) - MEDIUM confidence

### Project Context
- Moka CRM PROJECT.md - HIGH confidence (primary source)
- Current system analysis - HIGH confidence

## Gaps & Questions

### Medium Confidence Areas
- Exact n8n workflow patterns for CRM (verify with n8n docs in implementation)
- PocketBase multi-instance performance at scale (load testing recommended)
- Green API rate limits and best practices (verify with official docs)

### Requiring Phase-Specific Research
- **Phase 3:** Cal.com webhook event types and handling
- **Phase 4:** Resend template management best practices
- **Phase 5:** Auto-provisioning security considerations
- **Phase 6:** Analytics query optimization for SQLite

### Open Questions
- Maximum practical PocketBase instances per host?
- n8n scaling with 100+ customer workflows?
- Cost structure for external services at scale?

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| System Architecture | HIGH | Based on project requirements and standard CRM patterns |
| Component Boundaries | HIGH | Clear separation of concerns established |
| Data Flow | HIGH | Standard lead funnel with automation integration |
| Multi-Instance Pattern | MEDIUM | Verified with web search, needs load testing |
| Build Order | HIGH | Logical dependencies clear |
| Scalability Considerations | MEDIUM | Theoretical projections, need real-world validation |
