# Agent Implementation - SCO Digital Assistant (Soup Cookoff)

## Project Overview

**Type**: Voice Receptionist (Twilio + OpenAI Realtime)
**Purpose**: Nonprofit event voice assistant for The Soup Cookoff organization

## Tech Stack

```
Backend:     Node.js + Express + TypeScript
Database:    PostgreSQL + Prisma ORM
Queue:       BullMQ (background jobs)
Cache:       Redis
Telephony:   Twilio Programmable Voice
Voice AI:    OpenAI Realtime API
Payment:     Stripe integration
Frontend:    EJS templates + Bootstrap 5
Container:   Docker + Docker Compose
```

## Key Components

- `src/realtime/toolRegistry.ts` - Voice tools (event info, registration)
- `src/realtime/mediaServer.ts` - Media streaming bridge
- `src/services/stripe/` - Payment processing
- `src/routes/` - Admin API routes
- `prisma/schema.prisma` - Database schema

---

## Recommended Agents

### MUST IMPLEMENT (Priority 1)

| Agent | File | Use Case |
|-------|------|----------|
| **Backend Architect** | engineering/backend-architect.md | Event registration, Stripe integration, WebSocket architecture |
| **DevOps Automator** | engineering/devops-automator.md | Docker, Redis, BullMQ, PostgreSQL management |
| **AI Engineer** | engineering/ai-engineer.md | OpenAI Realtime API, event info tools |
| **Database Admin** | data/database-admin.md | PostgreSQL, event/registration schema |
| **Security Auditor** | security/security-auditor.md | Payment security (PCI), webhook validation |
| **Bug Debugger** | quality/bug-debugger.md | Payment flow issues, registration bugs |

### SHOULD IMPLEMENT (Priority 2)

| Agent | File | Use Case |
|-------|------|----------|
| **API Tester** | testing/api-tester.md | Stripe webhooks, Twilio callbacks |
| **Performance Benchmarker** | testing/performance-benchmarker.md | Registration flow latency |
| **Infrastructure Maintainer** | studio-operations/infrastructure-maintainer.md | BullMQ jobs, Redis health |
| **Code Reviewer** | quality/code-reviewer.md | TypeScript patterns, payment handling |
| **UI Designer** | design/ui-designer.md | Event admin interface |

### COULD IMPLEMENT (Priority 3)

| Agent | File | Use Case |
|-------|------|----------|
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Event registration analytics |
| **Content Creator** | marketing/content-creator.md | Event descriptions, FAQ |
| **Workflow Optimizer** | testing/workflow-optimizer.md | Registration flow optimization |

---

## Agent Prompts Tailored for This Project

### Backend Architect Prompt Addition
```
Project Context:
- Voice assistant for nonprofit event (Soup Cookoff)
- Event registration with Stripe payment processing
- Voice menu routing and event information
- Knowledge base for event FAQs
- Key files: src/services/stripe/, src/realtime/toolRegistry.ts
```

### AI Engineer Prompt Addition
```
Project Context:
- OpenAI Realtime API for voice interaction
- Tools: get_event_info, register_attendee, process_payment, take_message
- Stripe checkout integration for donations/tickets
- Voicemail capability for after-hours
```

### Security Auditor Prompt Addition
```
Project Context:
- Stripe payment processing (PCI compliance considerations)
- Attendee PII (name, email, phone)
- Webhook signature validation (Stripe, Twilio)
- Nonprofit donor information protection
```

---

## Marketing & Growth Agents (When Production Ready)

Add these when the project is ready for public release/marketing:

### Social Media & Marketing

| Agent | File | Use Case |
|-------|------|----------|
| **TikTok Strategist** | marketing/tiktok-strategist.md | Event highlights, soup cooking clips, community vibes |
| **Instagram Curator** | marketing/instagram-curator.md | Event photos, soup presentations, volunteer spotlights |
| **Twitter/X Engager** | marketing/twitter-engager.md | Event updates, local community engagement |
| **Reddit Community Builder** | marketing/reddit-community-builder.md | Local subreddits, r/nonprofit, r/charity |
| **Content Creator** | marketing/content-creator.md | Event descriptions, FAQ, volunteer information |
| **SEO Optimizer** | marketing/seo-optimizer.md | Local event SEO, charity keywords |
| **Visual Storyteller** | design/visual-storyteller.md | Event imagery, community impact photos |

### Growth & Analytics

| Agent | File | Use Case |
|-------|------|----------|
| **Growth Hacker** | marketing/growth-hacker.md | Attendee acquisition, sponsor outreach |
| **Trend Researcher** | product/trend-researcher.md | Nonprofit event trends, fundraising ideas |
| **Finance Tracker** | studio-operations/finance-tracker.md | Ticket sales, donation tracking, event ROI |
| **Analytics Reporter** | studio-operations/analytics-reporter.md | Registration metrics, attendance analytics |

---

## Not Recommended for This Project

| Agent | Reason |
|-------|--------|
| Mobile App Builder | No mobile app |
| UX Researcher | Simple event registration flow |

---

## Implementation Commands

```bash
# Invoke agents from project root
claude --agent engineering/backend-architect
claude --agent engineering/devops-automator
claude --agent engineering/ai-engineer
claude --agent data/database-admin
claude --agent security/security-auditor
claude --agent quality/bug-debugger
```
