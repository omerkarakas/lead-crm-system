---
phase: 02-whatsapp-qualification
plan: 02
subsystem: whatsapp, webhook, background-job
tags: green-api, pocketbase, nextjs, typescript

# Dependency graph
requires:
  - phase: 02-01
    provides: QA questions data model, API, types, welcome message config
provides:
  - WhatsApp webhook endpoint for incoming messages
  - Background job for delayed poll sending
  - Poll message formatting and sending
  - Answer parsing and validation
  - QA answers collection for storing responses
affects:
  - 02-03: Answer processing will use the score calculation logic

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Webhook endpoint for Green API
    - Background job with setTimeout for delayed execution
    - Phone-based lead lookup
    - Poll format message generation
    - Answer parsing with multiple format support
    - Green API message logging

key-files:
  created:
    - pb_migrations/1772534800_created_whatsapp_messages.js
    - pb_migrations/1772534900_created_qa_answers.js
    - lib/api/whatsapp.ts
    - lib/whatsapp/message-formatter.ts
    - lib/whatsapp/poll-parser.ts
    - app/api/whatsapp/webhook/route.ts
  modified:
    - lib/api/leads.ts (sendPollAfterDelay, findLeadByPhone, createLead)
    - lib/api/qa.ts (saveAnswer, getLeadAnswers, calculateLeadTotalScore)
    - types/qa.ts (WhatsAppMessage with green_api_id, QAAnswer question_id optional)
    - types/lead.ts (qa_sent, qa_sent_at, qa_completed, qa_completed_at, total_score)
    - pb_schema.json (whatsapp_messages, qa_answers collections, lead fields)

key-decisions:
  - "1 minute delay after lead creation for poll sending"
  - "Poll format: both questions in single message"
  - "Answer format: '1a, 2b' or 'a b' or 'ab' - multiple formats supported"
  - "Phone lookup: remove @c.us suffix and non-numeric characters"
  - "Background job uses setTimeout (fire-and-forget) - proper job queue for production"
  - "Green API credentials from environment variables"
  - "Quality score threshold: 80 points for qualification"

patterns-established:
  - "Webhook → Parse → Lookup → Process → Respond"
  - "Background job with delay"
  - "Green API message logging"
  - "Answer parsing with multiple format support"

# Metrics
estimated_tasks: 5
estimated_duration: 30 min
actual_duration: 2 min
started: 2026-03-03T10:47:20Z
completed: 2026-03-03T10:49:27Z
---

# Phase 2 Plan 2: WhatsApp Integration & QA Flow Engine Summary

**Lead oluşturulduktan 1 dakika sonra WhatsApp poll göndermek ve gelen cevapları işleyip skor hesaplamak için tam sistem kuruldu.**

## Performance

- **Duration:** 2 minutes
- **Tasks:** 5/5 completed
- **Velocity:** ~28 min faster than estimated

## Accomplishments

1. **WhatsApp Messages Collection Created**
   - `whatsapp_messages` collection with fields: lead_id, direction, message_text, message_type, status, sent_at, green_api_id
   - Added indexes for lead_id and sent_at for performance
   - Supports both incoming and outgoing messages
   - Added "received" status for incoming messages

2. **QA Answers Collection Created**
   - `qa_answers` collection with fields: lead_id, question_id, selected_answer, points_earned, answered_at
   - Stores each answer separately for detailed tracking
   - Cascade delete with leads and questions

3. **WhatsApp API Integration**
   - Created `lib/api/whatsapp.ts` with Green API integration
   - `sendWhatsAppMessage()` function for sending messages via Green API
   - `logWhatsAppMessage()` function for logging to whatsapp_messages collection
   - `getLeadWhatsAppMessages()` function for retrieving lead messages
   - Environment variables for Green API credentials

4. **Background Job for Delayed Poll Sending**
   - `sendPollAfterDelay()` function with 1 minute delay
   - Triggered automatically on lead creation (fire-and-forget)
   - Checks if poll already sent to avoid duplicates
   - Formats poll message, sends via WhatsApp, logs message
   - Updates lead qa_sent and qa_sent_at flags

5. **Poll Message Formatter**
   - `formatPollMessage()` for WhatsApp poll message formatting
   - `formatBookingLinkMessage()` for qualified leads
   - `formatLowQualityMessage()` for non-qualified leads
   - `formatRetryMessage()` for invalid answer format

6. **Poll Answer Parser**
   - `parsePollAnswer()` supports multiple formats: '1a, 2b', '1a2b', 'ab', 'a b', '1a 2b'
   - `validateAnswers()` validates answer indices and options
   - `formatAnswersForDisplay()` for displaying answers

7. **WhatsApp Webhook Endpoint**
   - Created `app/api/whatsapp/webhook/route.ts`
   - Handles Green API webhook format for incoming messages
   - Extracts phone number and message text from webhook payload
   - Finds lead by phone number
   - Parses answer, validates, saves to qa_answers collection
   - Calculates total score, updates lead quality
   - Sends appropriate response (booking link or low quality message)
   - Logs all messages to whatsapp_messages collection
   - Handles invalid format with retry message
   - Handles unknown senders gracefully

8. **Lead Schema Updates**
   - Added qa_sent, qa_sent_at, qa_completed, qa_completed_at fields
   - Added total_score field for QA score tracking

## Task Commits

| Commit | Message |
|--------|---------|
| 115ac87 | feat(02-02): create whatsapp_messages collection and update lead schema |
| dd4188e | feat(02-02): create background job for delayed poll sending |
| a08cb8d | feat(02-02): create poll message formatter |
| 9d98528 | feat(02-02): create poll answer parser and qa_answers collection |
| c01f8b9 | feat(02-02): create WhatsApp webhook endpoint |

## Files Created

1. `pb_migrations/1772534800_created_whatsapp_messages.js` - Migration for WhatsApp messages collection
2. `pb_migrations/1772534900_created_qa_answers.js` - Migration for QA answers collection
3. `lib/api/whatsapp.ts` - WhatsApp API functions (send, log, get messages)
4. `lib/whatsapp/message-formatter.ts` - Message formatting functions
5. `lib/whatsapp/poll-parser.ts` - Poll answer parser
6. `app/api/whatsapp/webhook/route.ts` - WhatsApp webhook endpoint

## Files Modified

1. `pb_schema.json` - Added whatsapp_messages and qa_answers collections, lead QA fields
2. `lib/api/leads.ts` - Added sendPollAfterDelay, findLeadByPhone, updated createLead
3. `lib/api/qa.ts` - Implemented saveAnswer, getLeadAnswers, calculateLeadTotalScore
4. `types/qa.ts` - Updated WhatsAppMessage with green_api_id, made question_id optional
5. `types/lead.ts` - Added qa_sent, qa_sent_at, qa_completed, qa_completed_at, total_score

## Decisions Made

1. **Poll Sending Delay**: 1 minute delay after lead creation for poll sending
2. **Background Job**: Uses setTimeout (fire-and-forget) - proper job queue recommended for production
3. **Answer Format Support**: Multiple formats supported for better UX ('1a, 2b', '1a2b', 'ab', 'a b', '1a 2b')
4. **Phone Lookup**: Removes @c.us suffix and non-numeric characters for flexible matching
5. **Green API**: Uses environment variables for credentials (GREEN_API_INSTANCE_ID, GREEN_API_TOKEN)
6. **Quality Threshold**: 80 points required for lead qualification
7. **Message Logging**: All WhatsApp messages logged to whatsapp_messages collection
8. **Answer Storage**: Each answer stored separately in qa_answers collection for detailed tracking

## Deviations from Plan

**None - plan executed exactly as written.**

All tasks completed according to specifications with no unexpected issues or deviations.

## Issues Encountered

**None.**

Implementation was straightforward with no blocking issues.

## User Setup Required

1. **PocketBase Collections**: The `whatsapp_messages` and `qa_answers` collections are created via migration. Run the migration to apply:
   ```bash
   # The migration will be applied automatically when PocketBase starts
   # Or manually via PocketBase admin panel
   ```

2. **Green API Credentials**: Set the following environment variables:
   ```bash
   GREEN_API_INSTANCE_ID=your_instance_id
   GREEN_API_TOKEN=your_api_token
   ```

3. **Green API Webhook**: Configure the webhook URL in Green API settings:
   ```
   Webhook URL: https://your-domain.com/api/whatsapp/webhook
   ```

4. **Active Questions**: Ensure at least one active question exists for polls to be sent

## Next Phase Readiness

**Ready for 02-03 (Answer Processing)**

- WhatsApp webhook is ready to receive and process answers
- Answers are saved to qa_answers collection
- Scores are calculated and lead quality is updated
- Appropriate responses are sent based on quality

**Considerations for 02-03:**
- The webhook already handles answer processing
- Lead quality is updated automatically
- Booking link is sent for qualified leads
- Low quality message is sent for non-qualified leads
- All messages are logged for tracking

**Considerations for production:**
- Replace setTimeout with proper job queue (Bull, Faktory, Vercel Cron)
- Add rate limiting for webhook endpoint
- Add webhook signature verification for security
- Add retry logic for failed WhatsApp messages
- Add monitoring for Green API quota limits
