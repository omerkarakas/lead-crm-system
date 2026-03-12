---
phase: 06-polish-integration
plan: 02
subsystem: api
tags: [webhooks, typescript, authentication, api-integration, n8n]

# Dependency graph
requires:
  - phase: 06-polish-integration
    plan: 01
    provides: Activity timeline with event aggregation
provides:
  - Webhook API endpoints for external lead creation and status updates
  - Webhook authentication utilities supporting API key, bearer token, and HMAC signature
  - TypeScript types for webhook DTOs and responses
affects: [external-integrations, automation, n8n-workflows]

# Tech tracking
tech-stack:
  added: [webhook-authentication, hmac-signature-verification]
  patterns: [timing-safe comparison, cors preflight handling, structured error responses]

key-files:
  created:
    - types/webhook.ts
    - lib/utils/webhook-auth.ts
    - app/api/webhooks/leads/route.ts
    - app/api/webhooks/leads/[id]/route.ts
  modified: []

key-decisions:
  - "Webhook auth via environment variables (WEBHOOK_API_KEY, WEBHOOK_SECRET, WEBHOOK_AUTH_METHOD)"
  - "API key authentication as default method for simplicity"
  - "Timing-safe comparison for HMAC signature verification to prevent timing attacks"
  - "Webhooks granted admin privileges for status overrides"
  - "New lead creation for duplicates with 're-apply' status instead of updating existing"

patterns-established:
  - "Webhook response pattern: success boolean with data/message fields"
  - "Error response pattern: structured error types with user-friendly Turkish messages"
  - "Authentication middleware: validate before parsing, return 401 on auth failure"
  - "CORS support: OPTIONS endpoint with wildcard origin for webhook flexibility"

# Metrics
duration: 8min
completed: 2026-03-12
---

# Phase 6 Plan 2: Webhook API Summary

**Webhook endpoints for external lead creation and status updates with multi-method authentication, duplicate handling, and CORS support**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T14:00:00Z
- **Completed:** 2026-03-12T14:08:00Z
- **Tasks:** 4
- **Files modified:** 4 created

## Accomplishments

- Created comprehensive webhook TypeScript types for lead operations
- Implemented webhook authentication utilities supporting API key, bearer token, and HMAC signature
- Built lead creation webhook endpoint with duplicate detection
- Built lead status update webhook endpoint with admin privileges
- Added CORS support for cross-origin webhook requests
- Structured error responses with Turkish messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create webhook TypeScript types** - `d4da30e` (feat)
2. **Task 2: Create webhook authentication utilities** - `a324f2c` (feat)
3. **Task 3: Create lead creation webhook endpoint** - `517899f` (feat)
4. **Task 4: Create lead status update webhook endpoint** - `ce1f097` (feat)

**Plan metadata:** Not yet committed

## Files Created/Modified

- `types/webhook.ts` - Webhook DTOs, error types, and authentication interfaces
- `lib/utils/webhook-auth.ts` - Authentication utilities with timing-safe HMAC verification
- `app/api/webhooks/leads/route.ts` - POST endpoint for lead creation via webhooks
- `app/api/webhooks/leads/[id]/route.ts` - PATCH endpoint for lead status updates

## Decisions Made

- **Webhook authentication methods:** Support three methods (API key, bearer token, HMAC signature) for different integration scenarios
- **Environment-based configuration:** Auth method and credentials loaded from env vars for security and flexibility
- **Timing-safe comparison:** Use crypto.timingSafeEqual for HMAC signature verification to prevent timing attacks
- **Admin privileges for webhooks:** Grant webhooks admin-level status update capabilities for automation workflows
- **Duplicate lead handling:** Create new lead with 're-apply' status instead of updating existing, preserving lead history
- **CORS wildcard origin:** Allow cross-origin requests from any source for webhook flexibility
- **Turkish error messages:** User-facing error messages in Turkish for consistency with UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

**Environment variables to configure:**

Add to `.env.local`:

```bash
# Webhook authentication (choose one method)
WEBHOOK_AUTH_METHOD=api_key  # Options: api_key, bearer_token, hmac_signature
WEBHOOK_API_KEY=your-secret-api-key-here
WEBHOOK_SECRET=your-hmac-secret-here  # Required for hmac_signature method
WEBHOOK_HEADER_NAME=x-api-key  # Optional: custom header name
```

**Authentication methods:**

1. **API Key (default):** Send `X-API-Key: your-secret-api-key-here` header
2. **Bearer Token:** Send `Authorization: Bearer your-secret-api-key-here` header
3. **HMAC Signature:** Send `X-Signature: sha256=<hmac-hex>` header computed from request body

**Example webhook usage:**

```bash
# Create lead via webhook
curl -X POST http://localhost:3000/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "name": "Ahmet Yılmaz",
    "phone": "+905551234567",
    "email": "ahmet@example.com",
    "company": "ABC Şirketi",
    "utm_source": "google",
    "utm_medium": "cpc"
  }'

# Update lead status via webhook
curl -X PATCH http://localhost:3000/api/webhooks/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "status": "qualified",
    "force": false
  }'
```

## Next Phase Readiness

- Webhook infrastructure complete and ready for n8n integration
- Authentication system supports multiple methods for different security requirements
- Error handling provides clear feedback for integration debugging
- CORS support enables webhook calls from external automation platforms
- Status update endpoint respects auto-updated status restrictions with force override

Ready for external integration tools (n8n, Zapier, Make) to create and update leads programmatically.

---
*Phase: 06-polish-integration*
*Completed: 2026-03-12*
