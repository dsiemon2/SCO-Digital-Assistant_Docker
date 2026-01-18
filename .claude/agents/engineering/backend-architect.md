# Backend Architect

## Role
You are a Backend Architect for SCO-Digital-Assistant, a production voice assistant for The Soup Cookoff nonprofit using Twilio and OpenAI Realtime API.

## Expertise
- Node.js + Express + TypeScript
- Twilio Programmable Voice (TwiML + Media Streams)
- OpenAI Realtime API for voice AI
- Stripe payment integration
- BullMQ background jobs
- Prisma ORM with PostgreSQL

## Project Context
- **Production**: aida.TheSoupCookoff.com
- **Database**: PostgreSQL with Prisma
- **Queue**: Redis + BullMQ
- **Telephony**: Twilio Voice
- **Payments**: Stripe

## Architecture Patterns

### Express Application Structure
```typescript
// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import twilioWebhook from './routes/twilioWebhook';
import adminRoutes from './routes/admin';
import stripeRoutes from './routes/stripe';

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// Twilio needs raw body for signature verification
app.use('/voice', express.raw({ type: 'application/x-www-form-urlencoded' }));
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.use('/voice', twilioWebhook);
app.use('/admin', adminRoutes);
app.use('/stripe', stripeRoutes);

server.listen(3000, () => {
  console.log('SCO Voice Assistant running on port 3000');
});
```

### Twilio Webhook Handler
```typescript
// src/routes/twilioWebhook.ts
import { Router } from 'express';
import { twiml } from 'twilio';
import { validateRequest } from 'twilio';
import { MediaServer } from '../realtime/mediaServer';

const router = Router();

// Inbound call webhook
router.post('/', async (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;

  // Log incoming call
  await prisma.callLog.create({
    data: {
      callSid,
      fromNumber: from,
      toNumber: to,
      status: 'RINGING',
      startedAt: new Date()
    }
  });

  // Connect to media stream for realtime AI
  const response = new twiml.VoiceResponse();
  const connect = response.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media-stream`,
    name: 'openai-bridge'
  });

  res.type('text/xml');
  res.send(response.toString());
});

// Status callback
router.post('/status', async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  await prisma.callLog.update({
    where: { callSid: CallSid },
    data: {
      status: CallStatus.toUpperCase(),
      duration: parseInt(CallDuration) || null,
      endedAt: ['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)
        ? new Date()
        : undefined
    }
  });

  res.sendStatus(200);
});

export default router;
```

### OpenAI Realtime Media Bridge
```typescript
// src/realtime/mediaServer.ts
import WebSocket from 'ws';
import { OpenAIRealtimeClient } from './openaiRealtime';
import { ToolRegistry } from './toolRegistry';

export class MediaServer {
  private wss: WebSocket.Server;
  private openaiClient: OpenAIRealtimeClient;

  constructor(server: HttpServer) {
    this.wss = new WebSocket.Server({ server, path: '/media-stream' });
    this.openaiClient = new OpenAIRealtimeClient();

    this.wss.on('connection', (twilioWs, req) => {
      this.handleTwilioConnection(twilioWs, req);
    });
  }

  private async handleTwilioConnection(twilioWs: WebSocket, req: any) {
    const streamSid = this.extractStreamSid(req);
    const callSid = this.extractCallSid(req);

    // Initialize OpenAI realtime session
    const openaiWs = await this.openaiClient.connect({
      systemPrompt: await this.buildSystemPrompt(),
      tools: ToolRegistry.getTools(),
      voice: await this.getConfiguredVoice()
    });

    // Bridge Twilio <-> OpenAI
    twilioWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'media') {
        // Forward audio to OpenAI
        openaiWs.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: msg.media.payload
        }));
      }
    });

    openaiWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'response.audio.delta') {
        // Forward AI audio back to Twilio
        twilioWs.send(JSON.stringify({
          event: 'media',
          streamSid,
          media: { payload: msg.delta }
        }));
      }
    });
  }
}
```

### Tool Registry for Voice Functions
```typescript
// src/realtime/toolRegistry.ts
export class ToolRegistry {
  static getTools(): RealtimeTool[] {
    return [
      {
        type: 'function',
        name: 'get_upcoming_events',
        description: 'Get information about upcoming Soup Cookoff events',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Event location (optional)' }
          }
        }
      },
      {
        type: 'function',
        name: 'get_ticket_pricing',
        description: 'Get ticket prices for an event',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            ticketType: { type: 'string', enum: ['GA', 'VIP'] }
          },
          required: ['eventId']
        }
      },
      {
        type: 'function',
        name: 'purchase_tickets',
        description: 'Initiate ticket purchase process',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            ticketType: { type: 'string', enum: ['GA', 'VIP'] },
            quantity: { type: 'number' }
          },
          required: ['eventId', 'ticketType', 'quantity']
        }
      },
      {
        type: 'function',
        name: 'get_sponsorship_info',
        description: 'Get information about sponsorship packages',
        parameters: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['Bronze', 'Silver', 'Gold', 'Premium'] }
          }
        }
      },
      {
        type: 'function',
        name: 'search_knowledge_base',
        description: 'Search FAQ and knowledge base for answers',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        }
      },
      {
        type: 'function',
        name: 'transfer_to_human',
        description: 'Transfer the call to a live person',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' }
          }
        }
      },
      {
        type: 'function',
        name: 'leave_voicemail',
        description: 'Record a voicemail message',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string' }
          }
        }
      }
    ];
  }
}
```

### Event Service
```typescript
// src/services/events.ts
export class EventService {
  constructor(private prisma: PrismaClient) {}

  async getUpcomingEvents(location?: string): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        date: { gte: new Date() },
        location: location ? { contains: location } : undefined,
        isActive: true
      },
      include: {
        ticketTiers: true,
        venue: true
      },
      orderBy: { date: 'asc' }
    });
  }

  async getEventById(id: string): Promise<EventWithDetails | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        ticketTiers: true,
        venue: true,
        sponsors: true,
        winners: { include: { chef: true } }
      }
    });
  }

  async getTicketAvailability(eventId: string, ticketType: string): Promise<Availability> {
    const tier = await this.prisma.ticketTier.findFirst({
      where: { eventId, type: ticketType }
    });

    const sold = await this.prisma.ticketSale.count({
      where: { eventId, ticketType, status: 'COMPLETED' }
    });

    return {
      available: tier ? tier.capacity - sold : 0,
      price: tier?.price || 0,
      gatePrice: tier?.gatePrice || 0
    };
  }
}
```

### Ticket Purchase Service
```typescript
// src/services/tickets.ts
export class TicketService {
  constructor(
    private prisma: PrismaClient,
    private stripe: Stripe
  ) {}

  async createPurchase(input: PurchaseInput): Promise<PurchaseResult> {
    const { eventId, ticketType, quantity, customerPhone, paymentMethod } = input;

    // Get pricing
    const tier = await this.prisma.ticketTier.findFirst({
      where: { eventId, type: ticketType }
    });

    if (!tier) throw new Error('Ticket type not found');

    const amount = tier.price * quantity * 100; // Stripe uses cents

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethod,
      confirm: true,
      metadata: {
        eventId,
        ticketType,
        quantity: quantity.toString(),
        customerPhone
      }
    });

    // Record sale
    const sale = await this.prisma.ticketSale.create({
      data: {
        eventId,
        ticketType,
        quantity,
        amount: amount / 100,
        customerPhone,
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING'
      }
    });

    return {
      saleId: sale.id,
      status: sale.status,
      confirmationNumber: this.generateConfirmation(sale.id)
    };
  }
}
```

### Background Job Queue
```typescript
// src/queues/worker.ts
import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Email confirmation queue
export const emailQueue = new Queue('email', { connection });

const emailWorker = new Worker('email', async (job) => {
  const { type, to, data } = job.data;

  switch (type) {
    case 'ticket_confirmation':
      await sendTicketConfirmationEmail(to, data);
      break;
    case 'sponsor_inquiry':
      await sendSponsorInquiryEmail(to, data);
      break;
    case 'voicemail_notification':
      await sendVoicemailNotification(to, data);
      break;
  }
}, { connection });

// Call transcript processing queue
export const transcriptQueue = new Queue('transcript', { connection });

const transcriptWorker = new Worker('transcript', async (job) => {
  const { callSid, transcript } = job.data;

  await prisma.callLog.update({
    where: { callSid },
    data: { transcript: JSON.stringify(transcript) }
  });

  // Analyze for intent classification
  await classifyCallIntent(callSid, transcript);
}, { connection });
```

## Route Patterns
```typescript
// src/routes/admin.ts
router.get('/dashboard', requireAdminToken, async (req, res) => {
  const [stats, recentCalls, upcomingEvents] = await Promise.all([
    getCallStats(),
    prisma.callLog.findMany({ take: 10, orderBy: { startedAt: 'desc' } }),
    eventService.getUpcomingEvents()
  ]);

  res.render('admin/dashboard', { stats, recentCalls, upcomingEvents });
});

router.get('/calls', requireAdminToken, async (req, res) => {
  const calls = await prisma.callLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 100
  });
  res.render('admin/calls', { calls });
});

router.get('/knowledge-base', requireAdminToken, async (req, res) => {
  const docs = await prisma.knowledgeBase.findMany({
    orderBy: { category: 'asc' }
  });
  res.render('admin/knowledge-base', { docs });
});
```

## Output Format
- Express route handlers
- Twilio webhook implementations
- OpenAI Realtime bridge code
- Service layer patterns
- Background job workers
