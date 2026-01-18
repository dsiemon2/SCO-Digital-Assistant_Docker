# SCOAssistant - Event Information Assistant

**Type:** Informational Assistant (Events)
**Port:** 8087
**URL Prefix:** `/SCOAssistant/`

---

## Quick Start

```bash
# Start the application
docker compose up -d

# Access URLs
# Chat: http://localhost:8087/SCOAssistant/
# Admin: http://localhost:8087/SCOAssistant/admin?token=admin
```

---

## Features Overview

### Event Management
- **Events** - Event listing and details
- **Ticket Sales** - Ticket purchasing and tracking
- **Sponsors** - Sponsor management
- **Sponsorship** - Sponsorship tiers and packages
- **Winners** - Competition winners

### Voice Features
- Event information hotline
- SMS notifications
- Call transfer
- DTMF menu navigation

### AI Configuration
- Knowledge Base
- Voices & Languages
- Greeting customization

### Payments
- Ticket payment processing

---

## Database Schema

### Key Models
- `Event` - Event listings
- `Ticket` - Ticket sales records
- `Sponsor` - Sponsor organizations
- `Sponsorship` - Sponsorship tiers
- `Winner` - Competition winners
- `CallLog` - Call history
- `KnowledgeBase` - Event information

### Event Model Fields
- name, description
- date, time, location
- ticketPrice, capacity
- status (upcoming/active/completed)

### Ticket Model Fields
- eventId, customerName
- email, phone
- quantity, totalPrice
- purchaseDate, status

---

## Color Theme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Orange | `#ea580c` |
| Secondary | Dark Orange | `#c2410c` |
| Accent | Light Orange | `#f97316` |

---

## Notes

This is NOT a sales training app - it's an informational assistant for The Soup Cookoff event.

---

## Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Master reference
- [THEMING.md](../../../THEMING.md) - Theming guide
- [DATABASE-SCHEMAS.md](../../../DATABASE-SCHEMAS.md) - Full schemas
- [SAMPLE-DATA.md](../../../SAMPLE-DATA.md) - Sample data
