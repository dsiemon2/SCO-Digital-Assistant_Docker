# SCO Digital Assistant - Claude Code Conventions

**READ THIS ENTIRE FILE before making ANY changes to this project.**

---

## Project Overview

| Property | Value |
|----------|-------|
| **Type** | Voice Assistant |
| **Purpose** | AI voice assistant for nonprofit organization (events, donations, volunteer info) |
| **Port** | TBD |
| **URL Prefix** | `/SCOAI/` |
| **Theme** | Nonprofit/community branding |

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** Prisma + SQLite
- **Frontend:** EJS templates + Bootstrap 5 + Bootstrap Icons
- **Voice:** OpenAI Realtime API (WebSockets)
- **Container:** Docker + Docker Compose

## Key Features

- Event information and registration
- Donation processing assistance
- Volunteer opportunity information
- Organization hours and contact
- Call transfer to staff when needed

## File Structure

```
SCO-Digital-Assistant_Docker/
├── docker/
│   └── nginx.conf
├── docs/
├── kb/                    # Knowledge base files
├── src/
│   ├── routes/
│   └── server.ts
├── views/
│   └── admin/
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── Dockerfile
└── CLAUDE.md
```

## UI Standards

### Action Buttons - Must Have Tooltips
```html
<button class="btn btn-sm btn-outline-primary"
        data-bs-toggle="tooltip"
        title="Describe what this button does">
  <i class="bi bi-icon-name"></i>
</button>
```

### Data Tables - Must Have
1. Row Selection (checkbox column, select all, bulk actions)
2. Pagination (page size selector, navigation, showing X-Y of Z)

---

## Agent Capabilities

When working on this project, apply these specialized behaviors:

### Backend Architect
- Design Express routes for events, donations, volunteers
- Implement Prisma ORM with SQLite for event management
- Structure API endpoints for registration processing
- Handle donation workflow integration

### AI Engineer
- Design warm, community-focused voice persona
- Handle event inquiries naturally ("When is the next food drive?")
- Process volunteer interest expressions
- Guide donation conversations appropriately
- Graceful handoff to staff when needed

### Database Admin
- Schema for Events, Volunteers, Donations, Contacts
- Event registration and capacity tracking
- Volunteer hours and availability
- Donation records and acknowledgments

### Security Auditor
- Protect donor information carefully
- Secure volunteer personal data
- Validate registration inputs
- Review PCI compliance for donation mentions

### Content Creator
- Write event descriptions for voice readback
- Create volunteer opportunity summaries
- Design donation thank-you messages
- Craft mission-aligned greeting scripts

### Performance Optimizer
- Efficient event search and filtering
- Handle high-volume event registration periods
- Cache organization information
- Optimize voice response times
