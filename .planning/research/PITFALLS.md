# Domain Pitfalls: Lead CRM & Marketing Automation

**Project:** Moka CRM
**Domain:** Lead CRM & Marketing Automation Platform
**Researched:** 2026-03-01
**Target Market:** Turkish SMBs and Agencies
**Overall Confidence:** MEDIUM

## Critical Pitfalls

Mistakes that cause rewrites, major issues, or business failure.

### Pitfall 1: Multi-Instance Deployment Complexity

**What goes wrong:**
Teams underestimate the operational complexity of multi-instance (single-tenant) architecture. Each new customer requires a separate PocketBase instance with separate database, configuration, monitoring, and update management. As customer count grows from 10 to 100 to 1,000, operational overhead grows exponentially.

**Why it happens:**
- Confusing "multi-instance" with "multi-tenant" (shared database)
- Assuming deployment automation will handle itself
- Not planning for instance monitoring at scale
- Underestimating version fragmentation across customers

**Consequences:**
- Deployment time per customer: 2-4 hours (manual) → unsustainable at scale
- Update nightmares: Different customers on different versions
- Cost per customer remains high instead of declining with scale
- Monitoring becomes impossible without centralized logging
- Customer onboarding delays due to manual provisioning

**Warning Signs:**
- Manual steps in deployment checklist
- No centralized monitoring/alerting across instances
- Customers on different versions after updates
- Spending more time on operations than feature development

**Prevention Strategy:**
- Build deployment automation FIRST (before customer #10)
- Implement centralized logging (e.g., Loki, ELK) from day one
- Use infrastructure-as-code (Terraform, Docker Compose, Kubernetes)
- Design update propagation mechanism (canary deployments, staged rollouts)
- Plan for sharding strategy when SQLite hits 50GB per instance

**Phase to Address:** Phase 1 (Foundations) - Must build provisioning automation, monitoring, and update mechanisms before scaling to multiple customers.

---

### Pitfall 2: WhatsApp API Rate Limiting & Compliance

**What goes wrong:**
WhatsApp Business API has strict rate limits and compliance requirements. As of October 2025, limits changed to per-business portfolio basis. By January 2026, AI chatbots must be scoped to business-specific scenarios only. Violations result in API restrictions or account shutdown.

**Why it happens:**
- Not understanding WhatsApp's business portfolio model
- Assuming unlimited messaging is possible
- Building generic AI chatbots without business scope limits
- Not monitoring quality scores that affect rate limit expansion

**Consequences:**
- Message delivery failures when hitting rate limits
- API account suspension for compliance violations
- Unable to send marketing messages when most needed
- Customers losing trust in WhatsApp reliability
- Emergency rewrites to comply with 2026 AI chatbot rules

**Warning Signs:**
- Error messages: "API Too Many Calls", "Rate limit hit", "Cloud API message throughput reached"
- No queue system for message sending
- AI chatbot answers questions outside product/services scope
- No tracking of quality score or message limit tier

**Prevention Strategy:**
- Implement message queue system with rate limit handling
- Scope AI chatbots to business-specific scenarios ONLY (product questions, order processing, shipping)
- Add human handoff for out-of-scope questions
- Monitor quality score and message limit tier
- Design fallback to email/SMS when WhatsApp limits hit
- Use separate phone numbers for high-volume customers

**Phase to Address:** Phase 2 (WhatsApp Integration) - Must build rate limiting, queueing, and compliance scoping before any production use.

---

### Pitfall 3: Email Deliverability Collapse

**What goes wrong:**
Email domains get blacklisted, spam filters block messages, and sender reputation tanks. In 2026, Gmail's AI-powered spam filters specifically target sales-oriented content. Poor deliverability means nurturing campaigns never reach inboxes.

**Why it happens:**
- Not warming up domains properly
- Using spam trigger words in subject lines and content
- Not implementing SPF, DKIM, DMARC properly
- Sending too many emails too fast from new domains
- Poor list hygiene (bouncing emails, spam complaints)

**Consequences:**
- Open rates drop from 20-30% to <5%
- Nurture campaigns become ineffective
- Customer complaints that "emails aren't working"
- Emergency domain changes (losing all sending history)
- Wasted budget on campaigns that never reach recipients

**Warning Signs:**
- Open rate consistently below 10%
- Bounce rate above 2%
- Spam complaints above 0.3%
- Emails going to spam folder during testing
- No SPF/DKIM/DMARC configured

**Prevention Strategy:**
- Use separate subdomains for marketing vs. transactional emails (e.g., m.customer.com vs. t.customer.com)
- Warm up domains for 2+ weeks before production use
- Implement proper DNS: SPF, DKIM, DMARC for all sending domains
- Configure rate limits: max 50 emails/day per inbox during warmup
- Avoid spam triggers: "Free", "Discount", "Best Price" in subject lines
- Clean email lists weekly (remove bounces, invalid addresses)
- Monitor sender reputation weekly
- Include clear, one-click unsubscribe links

**Phase to Address:** Phase 1 (Foundations) - Set up email infrastructure with proper DNS, warmup protocols, and monitoring before any email sending.

---

### Pitfall 4: SQLite Scaling Bottleneck

**What goes wrong:**
PocketBase uses SQLite, which performs excellently under 10GB but degrades significantly beyond 50GB. Write serialization limits concurrency. When multiple customers hit large database sizes, system becomes unusably slow.

**Why it happens:**
- Not planning for data growth per customer
- Assuming SQLite can scale infinitely like PostgreSQL
- Not implementing data archival or partitioning
- No monitoring of database file size growth

**Consequences:**
- Query response times increase from <100ms to >5 seconds
- Dashboard loading becomes painfully slow
- Customer reports of "system is slow"
- Emergency migration to PostgreSQL (complex, expensive)
- Lost customers during migration downtime

**Warning Signs:**
- Database file size approaching 20GB
- Slow queries (>1 second) in monitoring
- Database locks causing timeout errors
- Dashboard taking >3 seconds to load

**Prevention Strategy:**
- Monitor database file size per customer
- Implement data archival: Move old leads/interactions to separate archive database
- Partition data by time (e.g., current year vs. historical)
- Design for sharding: Plan to split customers across multiple database instances
- Use read replicas where possible (PocketBase supports read queries on replicated databases)
- Set up alerts when database size exceeds 20GB per instance
- Document migration path to PostgreSQL for high-volume customers

**Phase to Address:** Phase 1 (Foundations) - Build monitoring and design archival strategy. Phase 3 (Scaling) - Implement archival/sharding when needed.

---

### Pitfall 5: Lead Scoring False Positives

**What goes wrong:**
Lead scoring model incorrectly identifies low-quality leads as high-priority. Sales team wastes time chasing bad leads while good leads go cold. Trust in the system erodes, and teams abandon automation.

**Why it happens:**
- Over-relying on single behavioral indicators (e.g., "visited pricing page")
- Not validating scoring model against actual conversions
- Using static scoring rules instead of predictive models
- Poor data quality skewing scores
- No feedback loop from sales to improve model

**Consequences:**
- Sales team ignoring high scores ("system is wrong again")
- Wasted sales effort on unqualified leads
- Good leads neglected because they scored lower
- Customer complaints about poor lead quality
- Lost revenue from missed opportunities

**Warning Signs:**
- Conversion rate on high-scoring leads below 15%
- Sales team frequently overriding scores
- No A/B testing of scoring models
- Scoring model hasn't been updated in 6+ months
- Low correlation between score and actual conversion

**Prevention Strategy:**
- Use multi-signal scoring (combine behaviors: download + pricing visit + email open)
- Implement quarterly model validation against conversion data
- Allow sales overrides with justification (use to retrain model)
- Track accuracy metrics: precision (predicted positives that are actually positive)
- Focus on conversion rate, not just score distribution
- A/B test different scoring models
- Start simple (rule-based) then evolve to AI-powered predictive scoring

**Phase to Address:** Phase 2 (Lead Scoring) - Build with validation framework from day one. Continuous improvement thereafter.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or reduced effectiveness.

### Pitfall 6: Over-Messaging & Unsubscribe Spikes

**What goes wrong:**
Nurturing campaigns send too many messages, causing unsubscribe rates to spike. Average unsubscribe rate is 0.15-0.20%; rates above 0.5% indicate severe over-messaging.

**Why it happens:**
- Not setting frequency caps per lead
- Sending same content across multiple channels simultaneously
- Not honoring user preferences
- Not segmenting by engagement level
- Assuming "more messages = more conversions"

**Consequences:**
- Unsubscribe rates 2-3x industry average
- Lead database shrinking faster than growing
- Damage to brand reputation
- Reduced effectiveness of all future campaigns
- Customer complaints about spam

**Warning Signs:**
- Unsubscribe rate above 0.3% consistently
- Sending more than 2-3 emails per week to same segment
- No frequency caps configured
- Same lead receiving email + WhatsApp + SMS simultaneously
- No preference center for users to customize frequency

**Prevention Strategy:**
- Implement frequency caps: max 2-3 emails per week per lead
- Coordinate across channels: Don't send email + WhatsApp same day
- Build preference center: Let users choose frequency and channels
- Segment by engagement: Active leads get more, inactive get less
- Monitor unsubscribe rates by campaign and segment
- Focus on content quality over quantity (60% text, 40% images)
- Honor opt-downs (reduce frequency instead of full unsubscribe)

**Phase to Address:** Phase 2 (Nurturing) - Build frequency management and preference centers before launching campaigns.

---

### Pitfall 7: White-Label Branding Inconsistency

**What goes wrong:**
White-label customers' branding appears inconsistent across the platform. Wrong logos, mismatched colors, or domains not properly configured damage customer trust and make the white-label offering look unprofessional.

**Why it happens:**
- Not designing theming system from the start
- Hardcoding colors/logos instead of using configuration
- Not testing white-label flows end-to-end
- Domain/SSL configuration complexity not anticipated
- Not providing proper customization tools

**Consequences:**
- White-label customers look unprofessional to their clients
- Customer complaints about branding errors
- Lost white-label sales due to poor demo experience
- Emergency rewrites to add theming system
- Support burden from branding issues

**Warning Signs:**
- Hardcoded colors or logos in CSS/templates
- No way for customers to upload custom branding
- Domain configuration requires manual DNS changes
- No preview mode for branding changes
- Branding not applied consistently across all pages

**Prevention Strategy:**
- Design theming system from day one (CSS variables, dynamic logos)
- Build branding customization UI (logo upload, color picker, custom domains)
- Implement subdomain routing: customer.mokacrm.com
- Automate SSL certificate provisioning (Let's Encrypt)
- Create preview mode for branding changes
- Test white-label flows with real beta customers
- Document branding guidelines and limitations

**Phase to Address:** Phase 1 (Foundations) - Design theming architecture. Phase 3 (White-Label) - Full implementation.

---

### Pitfall 8: n8n Workflow Drift & Schema Changes

**What goes wrong:**
n8n workflows break when data schema changes. Workflows become outdated, fail silently, or produce incorrect results. Teams lose trust in automation and revert to manual processes.

**Why it happens:**
- No versioning of workflows
- Schema changes not communicated to workflow maintainers
- Workflows not tested after schema changes
- No monitoring of workflow failures
- Complex workflows become unmaintainable

**Consequences:**
- Silent failures: Workflows run but produce wrong data
- Automated processes stop working
- Data inconsistencies between systems
- Emergency manual workarounds
- Lost productivity fixing broken workflows

**Warning Signs:**
- No workflow testing framework
- Schema changes deployed without updating n8n
- No alerts for workflow failures
- Workflows with 50+ nodes (too complex)
- No documentation of what workflows do

**Prevention Strategy:**
- Version control workflows (store in Git alongside code)
- Treat schema changes as breaking changes for workflows
- Implement workflow testing: Run sample data through and validate output
- Monitor workflow executions: Alert on failures or unusual patterns
- Break complex workflows into smaller, composable pieces
- Document workflow purpose and dependencies
- Consider workflow-as-code approach instead of GUI for complex flows

**Phase to Address:** Phase 2 (Integrations) - Build workflow management and testing alongside first n8n integration.

---

### Pitfall 9: GDPR/KVKK Non-Compliance

**What goes wrong:**
CRM system doesn't comply with GDPR (EU) or KVKK (Turkey) data protection requirements. This results in fines up to 200M TL, legal action, and loss of customer trust.

**Why it happens:**
- Not understanding local data protection laws
- Building consent management as afterthought
- Not implementing data subject rights (access, delete, export)
- No data breach notification procedures
- Assuming "we're too small to be noticed"

**Consequences:**
- Regulatory fines (KVKK: up to 200M TL)
- Legal action from affected individuals
- Forced business interruption during investigations
- Loss of enterprise customers who require compliance
- Reputational damage

**Warning Signs:**
- No consent management system
- No way for users to download/delete their data
- No data breach notification procedure
- No data retention policy
- Not registered with VERBIS (Turkey's data controller registry)

**Prevention Strategy:**
- Implement explicit consent management (KVKK requires "明示同意" - explicit consent)
- Build data subject rights: access, delete (right to be forgotten), export (data portability)
- Design data breach notification: Must report within 72 hours
- Implement data retention policies (auto-delete old data)
- Register with VERBIS if >50 employees or >2.5M TL revenue
- For cross-border transfers: Get KVKK approval or use standard contractual clauses
- Document all data processing activities
- Conduct privacy impact assessments for high-risk processing

**Phase to Address:** Phase 1 (Foundations) - Design consent management and data rights. Phase 2 (Compliance) - Full implementation before launch.

---

### Pitfall 10: Data Silos & Integration Failures

**What goes wrong:**
CRM data exists in isolation from other business systems. Sales, marketing, and customer service use different tools with no data flow. Leads get lost, follow-ups delayed, and customer experience suffers.

**Why it happens:**
- Not planning integrations from the start
- Assuming manual data entry will work
- Building custom integrations instead of using standard APIs
- Not investing in integration infrastructure
- Underestimating integration complexity

**Consequences:**
- Manual data switching between systems (wastes 2-5 hours/day)
- Data delays up to 24 hours
- Leads falling through cracks
- Poor customer experience (redundant questions)
- Low adoption of CRM system

**Warning Signs:**
- Users maintaining separate Excel spreadsheets
- "We'll integrate that later"
- No API documentation or webhooks
- Manual data import/export processes
- Complaining about "data being stuck in system X"

**Prevention Strategy:**
- Design API-first architecture from day one
- Use webhooks for real-time data sync
- Integrate with common tools: Zapier, n8n for no-code integrations
- Build standard integrations: Google Sheets, email tools, website forms
- Provide pre-built connectors for popular Turkish tools
- Document all APIs and webhooks
- Use integration platform for complex multi-system flows

**Phase to Address:** Phase 1 (Foundations) - Design API/webhook architecture. Phase 2 (Integrations) - Build core integrations.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rework.

### Pitfall 11: Poor Mobile Experience

**What goes wrong:**
CRM system doesn't work well on mobile devices. Sales reps in the field can't access lead info, update statuses, or respond to messages.

**Why it happens:**
- Designing for desktop only
- Not testing on mobile devices
- Using frameworks without good mobile support
- Not prioritizing mobile use cases

**Consequences:**
- Sales frustration when away from desk
- Delayed lead responses
- Reduced productivity
- Customer complaints about slow responses

**Prevention Strategy:**
- Design mobile-first or responsive from day one
- Test on real mobile devices
- Prioritize mobile use cases: quick status updates, call logging
- Consider native app for frequently used mobile features

---

### Pitfall 12: Insufficient Reporting & Analytics

**What goes wrong:**
Teams can't get insights from CRM data. Limited reports, no dashboards, or slow queries make it impossible to measure performance or make data-driven decisions.

**Why it happens:**
- Treating analytics as afterthought
- Not understanding user reporting needs
- Building reports as one-off instead of report builder
- Not optimizing queries for performance

**Consequences:**
- Can't measure ROI of marketing campaigns
- No visibility into sales pipeline
- Manual spreadsheet work for basic reporting
- Can't identify what's working/not working

**Prevention Strategy:**
- Build report builder from day one (not just pre-built reports)
- Optimize queries for dashboard loading (<3 seconds)
- Provide key metrics out of box: lead sources, conversion rates, pipeline value
- Export functionality for custom analysis

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Phase 1: Foundations | SQLite not monitored for growth | Set up size alerts, plan archival strategy from day one |
| Phase 1: Foundations | Email infrastructure not warmed up | Start warmup 2 weeks before production use |
| Phase 1: Foundations | No compliance framework | Build consent management, data rights before collecting any data |
| Phase 2: WhatsApp | Rate limiting not implemented | Build queue system with rate limits before first message |
| Phase 2: Lead Scoring | No validation framework | Track conversion vs. score from day one |
| Phase 2: Nurturing | Over-messaging | Implement frequency caps and preference center before campaigns |
| Phase 2: Integrations | n8n workflow drift | Version control workflows, test after schema changes |
| Phase 3: White-Label | Branding inconsistencies | Design theming system, test with beta customers |
| Phase 3: Scaling | Multi-instance deployment complexity | Build automation before customer #10 |
| Any Phase | Data silos | API-first architecture, integrate as you build |

---

## Turkish Market Considerations

### KVKK Compliance (Stricter than GDPR)
- **VERBIS Registration**: Mandatory if >50 employees or >2.5M TL annual revenue
- **Explicit Consent**: KVKK requires "明示同意" (explicit consent) - stricter than GDPR
- **Breach Notification**: Must report within 72 hours
- **Cross-Border Transfers**: Requires KVKK approval or standard contractual clauses
- **Fines**: Up to 200M Turkish Lira for violations

### Turkish SMB Specifics
- **WhatsApp Dominance**: WhatsApp is primary communication channel (more than email)
- **Price Sensitivity**: Turkish SMBs are price-sensitive; must demonstrate clear ROI
- **Agency Market**: Agencies serving SMBs need white-label capabilities and multi-client management
- **Localization**: Turkish language support is essential, not optional
- **Payment Integration**: Local payment gateways (iyzico, Stripe Turkey) required

### Cultural Considerations
- **Relationship-First**: Turkish business culture values personal relationships
- **Mobile-First**: High mobile usage; CRM must work excellently on mobile
- **Trust Building**: Longer sales cycles; nurturing must be patient, not aggressive

---

## Sources

**HIGH Confidence (Official Documentation):**
- WhatsApp Business API Documentation (rate limits, 2026 compliance)
- KVKK Official Documentation (Turkish data protection law)
- PocketBase Documentation (SQLite limitations)
- n8n Documentation (workflow automation)

**MEDIUM Confidence (Verified Sources):**
- CRM Failure Statistics (Butler Group 2002, Economist 2007, Forrester 2009)
- Email Deliverability Best Practices (2025-2026 industry standards)
- SQLite Performance Characteristics (official SQLite documentation)
- Multi-Instance SaaS Architecture (industry consensus)

**LOW Confidence (Web Search - Unverified):**
- Lead Scoring Accuracy Benchmarks (needs validation with customer data)
- White-Label SaaS Market Trends (rapidly evolving)
- Turkish CRM Market Size (conflicting sources)
- Marketing Automation Failure Rates (industry estimates vary)

**Confidence Notes:**
- WhatsApp compliance changes for 2026: HIGH (official announcements)
- KVKK requirements: MEDIUM (official docs available, but legal interpretation varies)
- SQLite scaling limits: HIGH (well-documented technical constraints)
- Lead scoring best practices: LOW (highly dependent on specific business context)
- Email deliverability tactics: MEDIUM (standards evolve, but core principles stable)

---

## Gaps Requiring Phase-Specific Research

The following areas require deeper research during specific implementation phases:

1. **Turkish Email Marketing Best Practices**: Phase 2 - Research industry-specific open rates, best send times, cultural preferences

2. **WhatsApp Adoption in Turkish SMBs**: Phase 2 - Verify usage patterns, business vs. personal WhatsApp separation

3. **Local Integration Partners**: Phase 2 - Identify popular Turkish tools (accounting, e-commerce) for integration

4. **Competitive Analysis in Turkish Market**: Phase 1 - Research local CRM competitors, pricing, feature gaps

5. **Agency White-Label Requirements**: Phase 3 - Interview Turkish agencies about white-label needs

6. **Hosting Infrastructure in Turkey**: Phase 3 - Research local hosting options, data residency requirements

7. **Payment Gateway Integration**: Phase 3 - Specific requirements for iyzico, Stripe Turkey, local banks

8. **Turkish SMB Sales Process Research**: Phase 1 - Understand typical B2B sales cycles in Turkey

---

## Research Complete

**Key Findings:**
1. Multi-instance architecture requires significant operational investment in automation before scaling
2. WhatsApp API compliance becomes stricter in 2026 (AI chatbot scoping required by Jan 1)
3. Email deliverability is increasingly difficult with AI spam filters; requires proper technical setup
4. SQLite scaling limitations (50GB threshold) require planning for archival/sharding
5. KVKK compliance is stricter than GDPR in several areas (explicit consent, VERBIS registration)

**Files Created:**
- `.planning/research/PITFALLS.md` - This file

**Confidence Assessment:**
| Area | Level | Reason |
|------|-------|--------|
| Multi-Instance Pitfalls | MEDIUM | Well-documented architectural challenge, but tooling evolves |
| WhatsApp Pitfalls | HIGH | Official Meta documentation for 2026 changes |
| Email Pitfalls | MEDIUM | Industry standards stable, but filters evolve |
| Database Pitfalls | HIGH | SQLite limitations well-documented technically |
| Lead Scoring Pitfalls | LOW | Highly context-dependent, needs customer data validation |
| Nurturing Pitfalls | MEDIUM | General principles stable, specifics vary by audience |
| White-Label Pitfalls | MEDIUM | Common patterns well-documented |
| Integration Pitfalls | MEDIUM | n8n patterns known, but workflow drift is under-documented |
| Compliance Pitfalls | HIGH | KVKK requirements official and clear |
| Turkish Market | MEDIUM | Some sources conflict, needs local validation |

**Roadmap Implications:**
- Phase 1 must address: Email infrastructure, compliance framework, multi-instance automation design
- Phase 2 must address: WhatsApp rate limiting/compliance, lead scoring validation, nurturing frequency management
- Phase 3 must address: White-label theming, scaling strategies (archival/sharding), Turkish localizations
- All phases need: API-first architecture to avoid data silos

**Ready for Roadmap:**
Research complete. Proceeding to roadmap creation.
