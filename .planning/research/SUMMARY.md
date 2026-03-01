# Project Research Summary

**Project:** Moka CRM - Lead & Marketing Automation Platform
**Domain:** Lead CRM & Marketing Automation
**Researched:** 2026-03-01
**Confidence:** MEDIUM

## Executive Summary

Moka CRM is a multi-instance, white-label CRM and marketing automation platform designed specifically for Turkish SMBs and agencies. The product differentiates itself through WhatsApp-first lead qualification and nurturing, automated appointment scheduling via Cal.com, and true data isolation through per-customer PocketBase instances.

Research indicates the optimal approach is a Vue 3 + Nuxt 4 + Element Plus frontend with TypeScript, backed by PocketBase for data persistence and n8n for workflow automation. This stack balances developer productivity (Vue's low learning curve), performance (PocketBase's speed under 50GB), and operational simplicity (single binary per customer instance).

The primary risks are operational complexity at scale (multi-instance deployment requires significant automation before customer #10), WhatsApp API compliance (rate limiting and 2026 AI chatbot scoping rules), and email deliverability (requires proper infrastructure setup from day one). KVKK (Turkish GDPR) compliance is stricter than EU GDPR in several areas, requiring explicit consent and VERBIS registration for qualifying businesses.

## Key Findings

### Recommended Stack

Vue 3 + Nuxt 4 + Element Plus + Pinia + PocketBase + n8n provides the best balance of development speed, performance, and maintainability for a small team building a CRM targeting Turkish SMBs.

**Core technologies:**
- **Vue 3 + Nuxt 4 + TypeScript** — Frontend framework — Lowest learning curve (2/5 vs React's 4/5), built-in state management via Pinia, strong admin dashboard ecosystem via Element Plus
- **Element Plus + TailwindCSS** — UI components — Purpose-built for admin panels with 100+ components, Vue 3 + TypeScript support, comprehensive table components with virtual scrolling
- **PocketBase** — Backend per customer — Single binary deployment, SQLite for speed (<10GB), real-time subscriptions, built-in auth, hooks for automation triggers
- **n8n** — Workflow automation — Orchestrate qualification sequences, nurturing campaigns, appointment reminders, external API integrations
- **ECharts + vue-echarts** — Analytics dashboards — Enterprise-grade charts, Turkish documentation, handles large datasets, dark/light theme support

### Expected Features

The feature landscape splits clearly between table stakes (expected features), differentiators (competitive advantages), and anti-features (explicitly NOT building).

**Must have (table stakes):**
- Lead CRUD Operations — Basic data management users expect
- Lead Search & Filtering — Users need to find leads quickly
- Lead Notes & Timeline — Complete interaction history
- Lead Scoring — Prioritize follow-up efforts (0-100 scale)
- WhatsApp Integration — Primary channel for Turkish market
- Email Sending — Basic communication with templates
- Appointment Booking — Cal.com integration for scheduling
- Basic Reporting — Lead counts, conversion rates, source attribution
- User Authentication — Security baseline with role-based access

**Should have (competitive):**
- **WhatsApp-First CRM** — Native WhatsApp workflows vs email-first CRMs (most treat WhatsApp as add-on)
- **Interactive Q&A Scoring** — Automated qualification via chatbot-like conversation flow
- **Multi-Channel Sequences** — Nurture across WhatsApp + Email intelligently
- **PocketBase Per-Tenant** — True data isolation with lightweight stack (each customer gets isolated DB)
- **White-Label Branding** — Resellers can customize completely (domains, logos, colors, emails)
- **Omnichannel Inbox** — Unified communication view (WhatsApp + Email threaded)
- **Behavior-Based Triggers** — Respond to lead actions (link clicks, responses)
- **Funnel Analytics** — Visual conversion tracking with drop-off analysis

**Defer (v2+):**
- Visual Campaign Builder — Start with simple sequence builder
- Advanced Analytics — Basic reporting sufficient initially
- Predictive Lead Scoring — Rule-based scoring sufficient for MVP
- Full White-Label Domains — Start with subdomains
- Mobile Apps — Responsive web + PWA sufficient

### Architecture Approach

Multi-instance architecture where each customer receives an isolated PocketBase instance (separate Docker container with dedicated database), shared n8n automation hub for workflow orchestration, and separate CRM UI per customer instance. Admin management panel provisions and monitors all customer instances.

**Major components:**
1. **Customer CRM UI** — Lead management, qualification viewing, appointment scheduling, campaign management — communicates with customer PocketBase API and n8n webhooks
2. **Admin Management Panel** — Customer instance provisioning, health monitoring, white-label configuration, user management — communicates with all PocketBase instances via management endpoints
3. **PocketBase Instance (per customer)** — Data persistence, real-time subscriptions, authentication, CRUD operations, hooks for automation triggers — single source of truth per customer
4. **n8n Automation Engine** — Workflow orchestration (qualification logic, nurturing sequences, appointment reminders), external service integration — communicates with all PocketBase instances via API
5. **Integration Layer** — External service adapters (Green API for WhatsApp, Resend for email, Cal.com for calendar) with rate limiting and message queue management

### Critical Pitfalls

Research identified critical pitfalls that cause rewrites, major issues, or business failure in this domain.

1. **Multi-Instance Deployment Complexity** — Build deployment automation FIRST (before customer #10), implement centralized logging (Loki/ELK) from day one, use infrastructure-as-code, design update propagation mechanism. Phase 1 must address this.

2. **WhatsApp API Rate Limiting & Compliance** — Implement message queue system with rate limit handling, scope AI chatbots to business-specific scenarios ONLY (required by Jan 2026), monitor quality score, design fallback to email/SMS. Phase 2 must address this.

3. **Email Deliverability Collapse** — Use separate subdomains for marketing vs transactional emails, warm up domains for 2+ weeks, implement proper DNS (SPF/DKIM/DMARC), configure rate limits (max 50/day during warmup). Phase 1 must address this.

4. **SQLite Scaling Bottleneck** — Monitor database file size per customer, implement data archival (move old leads to archive DB), partition by time, design for sharding, set alerts at 20GB. Phase 1 must design for this, Phase 3 implements when needed.

5. **Lead Scoring False Positives** — Use multi-signal scoring (combine behaviors), implement quarterly model validation, allow sales overrides, track accuracy metrics, start simple (rule-based) then evolve to AI-powered. Phase 2 must build with validation framework.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundations
**Rationale:** Must address critical pitfalls (multi-instance automation, email deliverability, compliance framework) before any customer-facing features. Building infrastructure first prevents rewrites and operational nightmares at scale.

**Delivers:** Provisioning automation, monitoring setup, email infrastructure with DNS, compliance framework (KVKK consent management, data rights), theming architecture for white-label, basic CRUD operations

**Addresses:** Table stakes features (Lead CRUD, Authentication, Basic Roles)

**Avoids:** Pitfall 1 (Multi-Instance Deployment Complexity), Pitfall 3 (Email Deliverability Collapse), Pitfall 9 (GDPR/KVKK Non-Compliance), Pitfall 7 (White-Label Branding Inconsistency)

### Phase 2: WhatsApp & Qualification
**Rationale:** This is the core differentiator (WhatsApp-first CRM) and highest value feature for customers. Must build rate limiting and compliance scoping before any production use to avoid API shutdowns.

**Delivers:** WhatsApp integration (Green API), message queue with rate limiting, QA question builder, WhatsApp Q&A flow with scoring, lead status automation, basic lead scoring with validation framework, simple nurturing sequences

**Uses:** Stack elements: PocketBase hooks, n8n workflows, Element Plus forms, VeeValidate validation

**Implements:** Architecture component: n8n Automation Engine for qualification workflows, PocketBase hooks for lead creation triggers

**Avoids:** Pitfall 2 (WhatsApp API Rate Limiting & Compliance), Pitfall 5 (Lead Scoring False Positives), Pitfall 6 (Over-Messaging & Unsubscribe Spikes)

### Phase 3: Nurturing & Appointments
**Rationale:** Builds on Phase 2's qualification foundation. High-scoring leads need appointment booking, low-scoring leads need nurturing. This phase completes the core lead-to-customer pipeline.

**Delivers:** Cal.com integration, appointment booking automation, email sequences, WhatsApp drip campaigns, multi-channel orchestration, basic reporting dashboards, frequency management and preference center

**Uses:** Stack elements: n8n for sequence workflows, ECharts for dashboards, date-fns for scheduling, vue-i18n for Turkish localization

**Implements:** Architecture component: Integration Layer for external APIs (Resend, Cal.com), PocketBase real-time subscriptions for dashboard updates

**Avoids:** Pitfall 6 (Over-Messaging & Unsubscribe Spikes), Pitfall 8 (n8n Workflow Drift & Schema Changes)

### Phase 4: White-Label & Scaling
**Rationale:** After core product is validated, invest in white-label features for agency market and scaling strategies for growth. This addresses the multi-tenant deployment complexity that increases with customer count.

**Delivers:** Full white-label branding (custom domains, CSS customization), tenant onboarding flow, data archival strategy, sharding strategy, centralized monitoring dashboard, advanced analytics

**Uses:** Stack elements: Docker Compose/Kubernetes for orchestration, nginx reverse proxy for routing, Sentry for error tracking

**Implements:** Architecture component: Admin Management Panel with provisioning automation, centralized logging (Loki/ELK)

**Avoids:** Pitfall 1 (Multi-Instance Deployment Complexity), Pitfall 4 (SQLite Scaling Bottleneck), Pitfall 7 (White-Label Branding Inconsistency)

### Phase Ordering Rationale

- **Why this order based on dependencies discovered:** Foundation infrastructure must exist before any customer-facing features (Phase 1). WhatsApp differentiation is highest value and requires compliance preparation before production (Phase 2). Nurturing and appointments depend on qualification working (Phase 3). White-label and scaling are premature before product-market fit (Phase 4).

- **Why this grouping based on architecture patterns:** Phase 1 establishes the multi-instance architecture (PocketBase per customer). Phase 2 adds the n8n automation hub for workflows. Phase 3 integrates external APIs (Resend, Cal.com). Phase 4 adds the admin management layer for scaling operations.

- **How this avoids pitfalls from research:** Each phase explicitly addresses 2-3 critical pitfalls before they can cause damage. Phase 1 prevents operational and compliance disasters. Phase 2 prevents WhatsApp API shutdowns and scoring model failures. Phase 3 prevents over-messaging and workflow drift. Phase 4 prevents scaling bottlenecks and white-label inconsistencies.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Email warmup protocols — need specific Turkish email provider best practices, KVKK implementation details — legal interpretation of "explicit consent" in CRM context
- **Phase 2:** WhatsApp Green API integration details — rate limit tiers, quality score monitoring, 2026 AI chatbot scoping rules; Turkish SMB WhatsApp usage patterns — business vs personal separation
- **Phase 3:** Cal.com webhook handling — appointment booking edge cases, Turkish time zone handling, local Turkish integrations (accounting, e-commerce tools)
- **Phase 4:** Turkish hosting infrastructure — data residency requirements, local providers vs EU hosting, payment gateway integration (iyzico, Stripe Turkey)

Phases with standard patterns (skip research-phase):
- **Phase 1:** PocketBase setup — well-documented, Vue 3 + Nuxt 4 + Element Plus — established patterns, Docker deployment — standard practices
- **Phase 2:** Form validation (VeeValidate) — mature library, basic CRUD — standard patterns, simple lead scoring — rule-based logic is straightforward
- **Phase 3:** Basic reporting — ECharts well-documented, email sequences — standard drip campaign patterns, appointment scheduling — Cal.com has good docs
- **Phase 4:** Multi-instance provisioning — Docker Compose patterns established, white-label theming — CSS variables approach is standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | WebSearch verified, official docs inaccessible due to quota. Vue ecosystem well-established, Nuxt 4 release pending (2025). |
| Features | HIGH | CRM domain well-researched, WhatsApp/Cal.com integrations verified via official docs, Turkish market specifics confirmed via multiple sources. |
| Architecture | HIGH | Multi-instance patterns well-documented, PocketBase limitations clear, n8n workflows established. Minor uncertainty on n8n scaling at 100+ instances. |
| Pitfalls | HIGH | WhatsApp compliance (2026 rules) official, SQLite limits documented, KVKK requirements official. Medium confidence on lead scoring specifics (highly context-dependent). |

**Overall confidence:** MEDIUM — Stack selection solid but Nuxt 4 pending, features and architecture well-understood, pitfalls identified with high confidence. Official documentation verification blocked by quota limits for some elements.

### Gaps to Address

- **Nuxt 4 Release Timeline:** Stable release expected Q2 2025. If delayed, fall back to Nuxt 3. No blockers, just monitor release.
- **PocketBase SDK Current Version:** Research suggests ^0.21+, verify latest during implementation. No breaking changes expected.
- **Element Plus Latest Features:** Minor uncertainty on newest components. Standard API patterns, no risk.
- **Turkish Email Deliverability:** Need to research local ESP best practices during Phase 1. Start with global standards (SPF/DKIM/DMARC), adapt based on testing.
- **Lead Scoring Model Validation:** Highly dependent on specific business context. Build framework in Phase 2, validate with real customer data post-launch.
- **n8n Scaling at 100+ Instances:** Architecture supports it, but real-world performance unknown. Monitor during Phase 4, implement sharding if needed.

## Sources

### Primary (HIGH confidence)
- WhatsApp Business API Documentation — rate limits, 2026 compliance changes, AI chatbot scoping rules
- KVKK Official Documentation — Turkish data protection law, explicit consent requirements, VERBIS registration
- PocketBase Documentation — SQLite limitations, hooks, real-time subscriptions, authentication
- n8n Documentation — workflow automation, webhook handling, external service integration
- Cal.com Documentation — appointment scheduling, webhooks, availability management

### Secondary (MEDIUM confidence)
- CRM Failure Statistics — Butler Group 2002, Economist 2007, Forrester 2009 (70% CRM failure rate)
- Email Deliverability Best Practices 2025-2026 — industry standards, SPF/DKIM/DMARC requirements
- SQLite Performance Characteristics — official documentation, 50GB threshold well-established
- Multi-Instance SaaS Architecture — industry consensus on operational patterns
- Vue 3 + Element Plus Ecosystem — community adoption, admin dashboard patterns

### Tertiary (LOW confidence)
- Turkish CRM Market Size — conflicting sources, needs local validation
- Lead Scoring Accuracy Benchmarks — needs validation with customer data
- White-Label SaaS Market Trends — rapidly evolving, competitive analysis needed
- Marketing Automation Failure Rates — industry estimates vary widely
- Turkish SMB Sales Process — cultural factors need local research

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
