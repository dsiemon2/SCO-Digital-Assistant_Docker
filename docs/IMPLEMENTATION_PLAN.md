# Implementation Plan - Soup Cookoff Digital Voice Assistant

## Goal

Deploy a production voice assistant that allows callers to:
1. Get event information (dates, locations, times)
2. Purchase tickets with credit card payment
3. Learn about sponsorship opportunities
4. Hear about past winners
5. Get chef registration information
6. Leave voicemails or transfer to humans

---

## Milestone 0: Project Setup & Infrastructure

### Tasks
- [ ] Initialize Node.js + TypeScript project
- [ ] Set up ESLint, Prettier, and TypeScript config
- [ ] Create Express server with `/healthz` endpoint
- [ ] Add Docker Compose (Postgres, Redis)
- [ ] Configure Prisma ORM with initial schema
- [ ] Create `.env.example` with all required variables
- [ ] Set up ngrok or public URL configuration

### Acceptance Criteria
- `GET /healthz` returns 200
- Database migrations run successfully
- Docker containers start without errors

---

## Milestone 1: Twilio Integration & Basic IVR

### Tasks
- [ ] Purchase/configure Twilio voice number
- [ ] Implement `/voice` webhook → TwiML greeting
- [ ] Implement `/voice/route` for DTMF menu:
  - Press 1: Event information
  - Press 2: Buy tickets
  - Press 3: Sponsorship info
  - Press 4: Past winners
  - Press 5: Chef registration
  - Press 0: Speak to someone
- [ ] Implement `/voice/voicemail` callback
- [ ] Set up Twilio status callbacks

### Acceptance Criteria
- Call the number → hear greeting
- DTMF routes work correctly
- Voicemail records and stores transcript

---

## Milestone 2: OpenAI Realtime Voice Integration

### Tasks
- [ ] Enable Twilio Media Streams
- [ ] Implement WebSocket bridge (`/media` endpoint)
- [ ] Configure OpenAI Realtime client:
  - Audio format: μ-law ↔ PCM16/16k conversion
  - Voice: Configure TTS voice
  - Turn detection: Server VAD
- [ ] Wire up basic tools:
  - `getEventInfo()` - Return upcoming events
  - `getTicketPrices()` - Return ticket pricing
  - `getSponsorshipInfo()` - Return sponsorship levels
  - `getPastWinners()` - Return winner information
  - `getChefInfo()` - Return chef registration details
  - `transferToHuman()` - Transfer to live agent
  - `takeVoicemail()` - Record voicemail

### Acceptance Criteria
- Natural voice conversation works
- Tools execute and return correct information
- Barge-in (interruption) works smoothly

---

## Milestone 3: Knowledge Base & FAQ

### Tasks
- [x] Create Prisma models: `KnowledgeDoc`, `KnowledgeChunk`, `SupportedLanguage`
- [x] Build knowledge base indexer (OpenAI text-embedding-3-small)
- [x] Create FAQ markdown files:
  - `events.md` - Event dates, locations, times
  - `tickets.md` - Pricing, what's included
  - `sponsors.md` - Sponsorship levels and benefits
  - `winners.md` - Past winner information
  - `chefs.md` - Chef registration process
  - `about.md` - AKT Foundation mission
  - `contact.md` - Contact information
- [x] Implement `answerQuestion()` tool with retrieval
- [x] Add spoken citations ("According to our FAQ...")
- [x] Multi-language support: 24 languages with translated KB content
  - English, Spanish, German, Chinese (Mandarin), Vietnamese, French, Italian, Portuguese
  - Japanese, Korean, Arabic, Hindi, Russian, Polish, Dutch, Dutch (Belgium)
  - Ukrainian, Filipino, Tagalog, Nepali, Persian, Galician, Hebrew, Serbian
- [x] Language detection using native names for greeting
- [x] 77+ docs, 90+ chunks across all languages

### Acceptance Criteria
- FAQ questions answered with context
- Citations spoken for grounded answers
- Unknown questions handled gracefully
- Multi-language responses supported

---

## Milestone 4: Stripe Payment Integration

### Tasks
- [ ] Set up Stripe account and API keys
- [ ] Create Prisma models: `Order`, `Payment`, `TicketPurchase`
- [ ] Implement payment tools:
  - `startTicketPurchase()` - Initiate purchase flow
  - `collectPaymentInfo()` - Gather card details securely
  - `processPayment()` - Execute Stripe charge
  - `confirmPurchase()` - Send confirmation
- [ ] Implement `/stripe/webhook` for payment events
- [ ] Add PCI compliance considerations:
  - Never store full card numbers
  - Use Stripe's tokenization
  - Announce "This call may be recorded"
- [ ] Send SMS/email confirmation after purchase

### Acceptance Criteria
- Complete ticket purchase via voice
- Payment processed successfully
- Confirmation sent to customer
- Order recorded in database

---

## Milestone 5: Admin UI

### Tasks
- [x] Create EJS views with Bootstrap styling
- [x] Implement admin routes (token-gated):
  - `/admin` - Dashboard (stats, recent calls, upcoming events)
  - `/admin/calls` - Call logs (caller name, phone, duration, outcome)
  - `/admin/tickets` - View ticket sales
  - `/admin/events` - Manage events
  - `/admin/sponsors` - Sponsorship inquiries
  - `/admin/sponsorship` - Sponsorship packages
  - `/admin/winners` - Past competition winners
  - `/admin/kb` - Knowledge base management
  - `/admin/voices` - Voice selection (8 OpenAI voices) and language management (24 languages)
  - `/admin/greeting` - Greeting configuration with preview
  - `/admin/analytics` - Usage analytics
  - `/admin/settings` - Business configuration
  - `/admin/about` - System information
- [x] Add CRUD operations for events
- [x] Add ticket sales reporting
- [x] Add call analytics dashboard
- [x] Add voice selection UI with male/female grouping and avatars
- [x] Add greeting config with character counter and browser TTS preview

### Acceptance Criteria
- Admin can manage events
- Ticket sales visible in dashboard
- Call logs show conversation history with caller name and duration
- Analytics display useful metrics
- Admin can select assistant voice and enable/disable languages
- Admin can customize greeting message

---

## Milestone 6: Background Jobs & Notifications

### Tasks
- [ ] Set up BullMQ queues:
  - `kb-index` - Knowledge base indexing
  - `transcription` - Voicemail STT
  - `notifications` - Email/SMS sending
  - `payment-confirmation` - Post-purchase actions
- [ ] Implement workers for each queue
- [ ] Add Slack/email notifications for:
  - New voicemails
  - Sponsorship inquiries
  - Large ticket orders
- [ ] Add job retry logic and dead-letter handling

### Acceptance Criteria
- KB articles indexed automatically
- Voicemails transcribed in background
- Notifications sent reliably
- Failed jobs visible in admin

---

## Milestone 7: Testing & QA

### Tasks
- [ ] Unit tests for tools and services
- [ ] Integration tests for Twilio webhooks
- [ ] End-to-end call testing:
  - Event inquiry flow
  - Ticket purchase flow (test mode)
  - Sponsorship inquiry flow
  - Transfer to human flow
  - Voicemail flow
- [ ] Edge case testing:
  - Noisy environments
  - Unclear speech
  - Interruptions
  - Timeouts
- [ ] Load testing with synthetic calls

### Acceptance Criteria
- All unit tests pass
- E2E scenarios complete successfully
- Edge cases handled gracefully
- Performance meets latency targets (<600ms)

---

## Data Model (Prisma Schema)

```prisma
model Event {
  id          String   @id @default(cuid())
  name        String
  date        DateTime
  location    String
  address     String?
  gaPriceOnline   Decimal
  gaPriceGate     Decimal
  vipPriceOnline  Decimal
  vipPriceGate    Decimal
  gaCapacity      Int
  vipCapacity     Int
  gaSold          Int      @default(0)
  vipSold         Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tickets     TicketPurchase[]
}

model TicketPurchase {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id])
  ticketType  String   // GA or VIP
  quantity    Int
  unitPrice   Decimal
  totalPrice  Decimal
  customerName    String
  customerEmail   String
  customerPhone   String
  paymentId       String?
  paymentStatus   String   // pending, completed, failed, refunded
  confirmationCode String  @unique
  callLogId       String?
  callLog         CallLog? @relation(fields: [callLogId], references: [id])
  createdAt   DateTime @default(now())
}

model CallLog {
  id          String   @id @default(cuid())
  callSid     String   @unique
  fromNumber  String
  toNumber    String
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  outcome     String?  // completed, voicemail, transferred, ticket_purchase
  intents     IntentLog[]
  tickets     TicketPurchase[]
  messages    Message[]
  createdAt   DateTime @default(now())
}

model IntentLog {
  id          String   @id @default(cuid())
  callLogId   String
  callLog     CallLog  @relation(fields: [callLogId], references: [id])
  intent      String
  confidence  Float?
  resolved    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Message {
  id          String   @id @default(cuid())
  callLogId   String
  callLog     CallLog  @relation(fields: [callLogId], references: [id])
  type        String   // voicemail, sponsorship_inquiry, general
  subject     String?
  body        String
  transcript  String?
  notified    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model KnowledgeDoc {
  id          String   @id @default(cuid())
  title       String
  content     String
  language    String   @default("en")
  chunks      KnowledgeChunk[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model KnowledgeChunk {
  id          String   @id @default(cuid())
  docId       String
  doc         KnowledgeDoc @relation(fields: [docId], references: [id])
  content     String
  embedding   Float[]
  createdAt   DateTime @default(now())
}

model SponsorInquiry {
  id              String   @id @default(cuid())
  contactName     String
  companyName     String?
  phone           String
  email           String?
  interestedLevel String?  // presenting, premium, economic, basic
  notes           String?
  callLogId       String?
  followedUp      Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

---

## Non-Functional Requirements

### Performance
- Voice response latency: < 600ms end-to-end
- Payment processing: < 5 seconds
- KB retrieval: < 500ms

### Reliability
- Graceful degradation: DTMF fallback if AI fails
- Payment retry logic with idempotency
- Queue-based processing for resilience

### Security
- PCI DSS considerations for payments
- HTTPS everywhere
- Secrets in environment variables
- Recording disclosure announcement
- PII minimization in logs

### Compliance
- "This call may be recorded" disclosure
- Caller consent for data collection
- Data retention policies

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Caller accent/noise issues | Use OpenAI VAD, confirm critical details verbally |
| Payment failures | Retry logic, offer to call back, store partial orders |
| API outages | Fallback to DTMF menu, queue for retry |
| High call volume | Auto-scaling, queue management, capacity limits |
| Fraudulent payments | Stripe Radar, velocity checks, manual review option |

---

## Definition of Done

- [ ] Phone number accepts calls and converses naturally
- [ ] Callers can hear event information
- [ ] Callers can purchase tickets with credit card
- [ ] Callers can learn about sponsorship
- [ ] Callers can hear past winners
- [ ] Callers can get chef registration info
- [ ] Callers can leave voicemail or transfer
- [ ] Admin can manage events and view analytics
- [ ] All documentation complete
