import { prisma } from '../db/prisma.js';
import { askKB } from '../services/kb.js';
import { getTicketPrices, processVoicePayment } from '../services/payments.js';
import { createBookingLink } from '../services/booking.js';
import { sendSMS, sendTicketConfirmation, sendSponsorFollowUp } from '../services/sms.js';
import { notifyTicketPurchase, notifySponsorInquiry, notifyTransferRequest } from '../services/notifications.js';

async function logIntent(intent: string, meta: any = {}) {
  try {
    await prisma.intentLog.create({ data: { intent, meta: JSON.stringify(meta) } });
  } catch {}
}

export const tools = {
  /**
   * Get policy/configuration settings
   */
  async getPolicy() {
    const cfg = await prisma.businessConfig.findFirst();
    return {
      kbMinConfidence: cfg?.kbMinConfidence ?? 0.55,
      lowConfidenceAction: cfg?.lowConfidenceAction ?? 'ask_clarify'
    };
  },

  /**
   * Set conversation language
   */
  async setLanguage(args: { lang: string }) {
    const lang = (args?.lang || 'en').substring(0, 5).toLowerCase();
    try {
      await prisma.languageLog.create({ data: { language: lang } });
    } catch {}
    await logIntent('setLanguage', { lang });
    return { ok: true, lang };
  },

  /**
   * Get upcoming events information
   */
  async getEventInfo(args?: { eventName?: string }) {
    await logIntent('getEventInfo', args);

    const events = await prisma.event.findMany({
      where: {
        active: true,
        date: { gte: new Date() },
        ...(args?.eventName ? {
          name: { contains: args.eventName }
        } : {})
      },
      orderBy: { date: 'asc' },
      take: 3
    });

    if (events.length === 0) {
      return { ok: false, message: 'No upcoming events found' };
    }

    const eventList = events.map(e => ({
      name: e.name,
      date: e.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      location: e.location,
      address: e.address,
      gaPrice: `$${e.gaPriceOnline} online / $${e.gaPriceGate} at gate`,
      vipPrice: `$${e.vipPriceOnline} online / $${e.vipPriceGate} at gate`,
      gaAvailable: e.gaCapacity - e.gaSold,
      vipAvailable: e.vipCapacity - e.vipSold,
    }));

    return { ok: true, events: eventList, nextEvent: eventList[0] };
  },

  /**
   * Get ticket pricing information
   */
  async getTicketPricing(args?: { eventId?: string }) {
    await logIntent('getTicketPricing', args);

    const prices = await getTicketPrices(args?.eventId);

    if (!prices) {
      return { ok: false, message: 'No events available for ticket purchase' };
    }

    return {
      ok: true,
      eventName: prices.event.name,
      eventDate: prices.event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      generalAdmission: {
        online: prices.gaOnline,
        atGate: prices.gaGate,
        available: prices.gaAvailable,
        includes: 'Event entry, tasting spoon, voting card, and program'
      },
      vip: {
        online: prices.vipOnline,
        atGate: prices.vipGate,
        available: prices.vipAvailable,
        includes: 'Early entry (30 min before GA), commemorative soup bowl, grocery bag, soup tray, spoon, voting card, and program'
      }
    };
  },

  /**
   * Process ticket purchase
   */
  async purchaseTickets(args: {
    ticketType: 'GA' | 'VIP';
    quantity: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    eventId?: string;
    callSid?: string;
  }) {
    await logIntent('purchaseTickets', {
      ticketType: args.ticketType,
      quantity: args.quantity,
      customerEmail: args.customerEmail
    });

    // Get next event if not specified
    let eventId = args.eventId;
    if (!eventId) {
      const nextEvent = await prisma.event.findFirst({
        where: { active: true, date: { gte: new Date() } },
        orderBy: { date: 'asc' }
      });
      if (!nextEvent) {
        return { ok: false, error: 'No upcoming events available' };
      }
      eventId = nextEvent.id;
    }

    // Find call log
    let callLogId: string | undefined;
    if (args.callSid) {
      const callLog = await prisma.callLog.findUnique({
        where: { callSid: args.callSid }
      });
      callLogId = callLog?.id;
    }

    const result = await processVoicePayment({
      eventId,
      ticketType: args.ticketType,
      quantity: args.quantity,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      cardNumber: args.cardNumber,
      expMonth: args.expMonth,
      expYear: args.expYear,
      cvc: args.cvc,
      callLogId,
    });

    if (result.success) {
      // Get event details for SMS
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const unitPrice = args.ticketType === 'VIP'
        ? Number(event?.vipPriceOnline || 35)
        : Number(event?.gaPriceOnline || 15);
      const totalPrice = `$${(unitPrice * args.quantity).toFixed(2)}`;

      // Send SMS confirmation (async, don't block)
      sendTicketConfirmation({
        to: args.customerPhone,
        customerName: args.customerName,
        eventName: event?.name || 'Soup Cook Off',
        eventDate: event?.date?.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }) || 'TBD',
        eventLocation: event?.location || 'TBD',
        ticketType: args.ticketType,
        quantity: args.quantity,
        confirmationCode: result.confirmationCode!,
        totalPrice
      }).catch(err => console.error('SMS send failed:', err));

      // Send Slack notification (async)
      notifyTicketPurchase({
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        eventName: event?.name || 'Soup Cook Off',
        ticketType: args.ticketType,
        quantity: args.quantity,
        totalPrice,
        confirmationCode: result.confirmationCode!
      }).catch(err => console.error('Slack notification failed:', err));

      return {
        ok: true,
        confirmationCode: result.confirmationCode,
        smsSent: true,
        message: `Your purchase is complete! Your confirmation code is ${result.confirmationCode}. I've sent a text message to your phone with all the details. You'll also receive a confirmation email at ${args.customerEmail}.`
      };
    } else {
      return { ok: false, error: result.error };
    }
  },

  /**
   * Get sponsorship information
   */
  async getSponsorshipInfo() {
    await logIntent('getSponsorshipInfo');

    return {
      ok: true,
      levels: [
        {
          name: 'Presenting Sponsor',
          price: 2500,
          available: 1,
          benefits: [
            'Up to 10x20 vendor booth',
            'Full-page program ad',
            'Logo on sponsor banner',
            '25 complimentary tickets',
            'PA announcements (up to 4)',
            'VIP bag promotional items'
          ]
        },
        {
          name: 'Premium Package',
          price: 1000,
          available: 4,
          benefits: [
            '10x10 vendor booth',
            'Full-page program ad',
            '20 complimentary tickets',
            'Social media recognition',
            'PA announcements (up to 2)'
          ]
        },
        {
          name: 'Economic Package',
          price: 500,
          available: 6,
          benefits: [
            '10x10 vendor booth',
            'Half-page program ad',
            '10 complimentary tickets',
            'Social media recognition'
          ]
        },
        {
          name: 'Basic Package',
          price: 250,
          available: 5,
          benefits: [
            '6-foot vendor table',
            'Business card-sized program ad',
            '5 complimentary tickets',
            'Logo on sponsor banner'
          ]
        }
      ],
      contact: 'Visit soupcookoff.com/sponsor or contact us through soupcookoff.com/contact'
    };
  },

  /**
   * Capture sponsor inquiry
   */
  async captureSponsorInquiry(args: {
    contactName: string;
    companyName?: string;
    phone: string;
    email?: string;
    interestedLevel?: string;
    notes?: string;
    callSid?: string;
  }) {
    await logIntent('captureSponsorInquiry', args);

    await prisma.sponsorInquiry.create({
      data: {
        contactName: args.contactName,
        companyName: args.companyName || null,
        phone: args.phone,
        email: args.email || null,
        interestedTier: args.interestedLevel || null,
        notes: args.notes || null,
      }
    });

    const tier = args.interestedLevel || 'General';

    // Send SMS follow-up to sponsor (async, don't block)
    sendSponsorFollowUp({
      to: args.phone,
      contactName: args.contactName,
      companyName: args.companyName,
      tier
    }).catch(err => console.error('Sponsor SMS send failed:', err));

    // Send Slack notification (async)
    notifySponsorInquiry({
      contactName: args.contactName,
      companyName: args.companyName,
      phone: args.phone,
      email: args.email,
      tier
    }).catch(err => console.error('Slack notification failed:', err));

    return {
      ok: true,
      smsSent: true,
      message: 'Thank you for your interest in sponsoring The Soup Cookoff! I\'ve sent you a text message with more information. Our team will contact you within 48 hours.'
    };
  },

  /**
   * Get past winners information
   */
  async getPastWinners() {
    await logIntent('getPastWinners');

    return {
      ok: true,
      message: 'For detailed results from past events including winners from both the People\'s Choice and Judge\'s Choice categories, please visit soupcookoff.com/winners.',
      recentEvents: [
        'Harrisburg September 2024',
        'Carlisle March 2024'
      ]
    };
  },

  /**
   * Get chef registration information
   */
  async getChefInfo() {
    await logIntent('getChefInfo');

    return {
      ok: true,
      divisions: [
        {
          name: 'Professional Chef',
          description: 'For restaurants and professional chefs',
          fee: 'Contact for pricing',
          registrationUrl: 'soupcookoff.com/chef-entry'
        },
        {
          name: 'Amateur Chef',
          description: 'For home cooks and cooking enthusiasts',
          fee: '$25 per event',
          registrationUrl: 'soupcookoff.com/chef-entry'
        },
        {
          name: 'Junior Chef',
          description: 'For young aspiring chefs',
          fee: 'Contact for details',
          registrationUrl: 'soupcookoff.com/chef-entry'
        }
      ],
      judgingCriteria: ['Taste', 'Presentation', 'Creativity', 'Overall Appeal'],
      awards: ['People\'s Choice', 'Judge\'s Choice']
    };
  },

  /**
   * Get information about the organization
   */
  async getAboutInfo() {
    await logIntent('getAboutInfo');

    return {
      ok: true,
      organization: 'The Soup Cookoff',
      beneficiary: 'AKT Foundation',
      mission: 'The AKT Foundation is a 501(c)(3) nonprofit dedicated to providing essential household necessities to families in extreme poverty and those impacted by domestic violence.',
      website: 'soupcookoff.com'
    };
  },

  /**
   * Transfer to human agent
   */
  async transferToHuman(args: { reason?: string; callerPhone?: string; callerName?: string }) {
    await logIntent('transferToHuman', args);

    // Send Slack notification about transfer request (async)
    notifyTransferRequest({
      fromNumber: args.callerPhone || 'Unknown',
      callerName: args.callerName,
      reason: args.reason
    }).catch(err => console.error('Slack transfer notification failed:', err));

    return { ok: true, reason: args?.reason || 'unspecified', action: 'TRANSFER' };
  },

  /**
   * Book an appointment
   */
  async bookAppointment(args: {
    dateTime?: string;
    durationMins?: number;
    purpose?: string;
    contact?: string;
    email?: string;
  }) {
    await logIntent('bookAppointment', args);

    const result = await createBookingLink({
      dateTime: args.dateTime,
      durationMins: args.durationMins || 30,
      purpose: args.purpose,
      contact: args.contact,
      email: args.email
    });

    if (result.booked) {
      return {
        ok: true,
        message: `Great! I've booked your appointment. ${args.contact ? 'I\'ve sent you a confirmation text with the details.' : 'You can view it at ' + result.link}`,
        mode: result.mode,
        link: result.link
      };
    } else {
      return {
        ok: true,
        message: `I've sent you a link to book your appointment. ${args.contact ? 'Check your text messages!' : 'Visit ' + result.link + ' to complete booking.'}`,
        mode: result.mode,
        link: result.link
      };
    }
  },

  /**
   * Take a voicemail message
   */
  async takeMessage(args: { subject?: string; details?: string; contact?: string }) {
    await logIntent('takeMessage', args);
    return {
      ok: true,
      ticketId: 'MSG-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      captured: args
    };
  },

  /**
   * Answer general questions using knowledge base
   * Applies confidence thresholds and gating based on BusinessConfig
   */
  async answerQuestion(args: { question: string; language?: string; callSid?: string }) {
    await logIntent('answerQuestion', { question: args.question });

    const lang = (args.language || 'en').substring(0, 5).toLowerCase();
    const res = await askKB(args.question, lang);

    // Get confidence policy
    const cfg = await prisma.businessConfig.findFirst();
    const minConfidence = cfg?.kbMinConfidence ?? 0.55;
    const lowConfidenceAction = cfg?.lowConfidenceAction ?? 'ask_clarify';

    // Log citation
    try {
      const call = args?.callSid
        ? await prisma.callLog.findUnique({ where: { callSid: String(args.callSid) } })
        : null;

      await prisma.citationsLog.create({
        data: {
          callLogId: call?.id || null,
          callSid: args?.callSid || null,
          question: args.question,
          language: lang,
          sources: JSON.stringify(res.sources || [])
        }
      });
    } catch {}

    // Check confidence threshold
    const topConfidence = res.sources[0]?.score ?? 0;

    if (topConfidence < minConfidence) {
      // Below threshold - apply gating action
      await logIntent('lowConfidenceKB', {
        question: args.question,
        confidence: topConfidence,
        action: lowConfidenceAction
      });

      if (lowConfidenceAction === 'transfer') {
        return {
          ok: false,
          lowConfidence: true,
          action: 'TRANSFER',
          message: "I'm not confident I have the right information for that question. Let me transfer you to someone who can help better."
        };
      } else if (lowConfidenceAction === 'voicemail') {
        return {
          ok: false,
          lowConfidence: true,
          action: 'VOICEMAIL',
          message: "I'm not sure I have the right answer for that. Would you like to leave a message and we'll get back to you with the correct information?"
        };
      } else {
        // ask_clarify (default)
        return {
          ok: false,
          lowConfidence: true,
          action: 'CLARIFY',
          message: "I'm not entirely sure about that. Could you rephrase your question or ask about something more specific like event dates, ticket prices, or sponsorship opportunities?",
          partialContext: res.context,
          sources: res.sources
        };
      }
    }

    // Good confidence - return the answer
    return {
      ...res,
      ok: true,
      confidenceOk: true,
      topConfidence
    };
  },

  /**
   * Send an SMS message to a phone number
   */
  async sendTextMessage(args: {
    to: string;
    message: string;
  }) {
    await logIntent('sendTextMessage', { to: args.to });

    const result = await sendSMS({
      to: args.to,
      body: args.message
    });

    if (result.success) {
      return {
        ok: true,
        message: `I've sent a text message to ${args.to}.`
      };
    } else {
      return {
        ok: false,
        error: result.error || 'Failed to send SMS'
      };
    }
  }
};

// Handle tool calls from OpenAI
export async function handleToolCall(name: string, args: any, callId?: string) {
  const tool = (tools as any)[name];
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    const result = await tool(args);
    return result;
  } catch (err: any) {
    return { error: err.message || 'Tool execution failed' };
  }
}

// Tool specifications for OpenAI
export const toolSpecs = [
  {
    name: 'getEventInfo',
    description: 'Get information about upcoming Soup Cookoff events including dates, locations, and ticket availability',
    input_schema: {
      type: 'object',
      properties: {
        eventName: { type: 'string', description: 'Optional event name to filter by' }
      }
    }
  },
  {
    name: 'getTicketPricing',
    description: 'Get ticket prices for upcoming events (GA and VIP options)',
    input_schema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Optional event ID' }
      }
    }
  },
  {
    name: 'purchaseTickets',
    description: 'Process a ticket purchase with credit card payment',
    input_schema: {
      type: 'object',
      properties: {
        ticketType: { type: 'string', enum: ['GA', 'VIP'], description: 'Type of ticket' },
        quantity: { type: 'number', description: 'Number of tickets' },
        customerName: { type: 'string', description: 'Customer full name' },
        customerEmail: { type: 'string', description: 'Customer email address' },
        customerPhone: { type: 'string', description: 'Customer phone number' },
        cardNumber: { type: 'string', description: 'Credit card number' },
        expMonth: { type: 'string', description: 'Card expiration month (MM)' },
        expYear: { type: 'string', description: 'Card expiration year (YY or YYYY)' },
        cvc: { type: 'string', description: 'Card security code' },
        eventId: { type: 'string', description: 'Optional event ID (defaults to next event)' }
      },
      required: ['ticketType', 'quantity', 'customerName', 'customerEmail', 'customerPhone', 'cardNumber', 'expMonth', 'expYear', 'cvc']
    }
  },
  {
    name: 'getSponsorshipInfo',
    description: 'Get information about sponsorship levels and benefits',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'captureSponsorInquiry',
    description: 'Capture a sponsorship inquiry for follow-up',
    input_schema: {
      type: 'object',
      properties: {
        contactName: { type: 'string', description: 'Contact person name' },
        companyName: { type: 'string', description: 'Company name' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address' },
        interestedLevel: { type: 'string', description: 'Which sponsorship level interested in' },
        notes: { type: 'string', description: 'Additional notes' }
      },
      required: ['contactName', 'phone']
    }
  },
  {
    name: 'getPastWinners',
    description: 'Get information about past Soup Cookoff winners',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'getChefInfo',
    description: 'Get information about entering as a chef in the competition',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'getAboutInfo',
    description: 'Get information about The Soup Cookoff organization and its charitable mission',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'transferToHuman',
    description: 'Transfer the caller to a human agent',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for transfer' },
        callerPhone: { type: 'string', description: 'Caller phone number for notification' },
        callerName: { type: 'string', description: 'Caller name if known' }
      }
    }
  },
  {
    name: 'bookAppointment',
    description: 'Book an appointment or send a booking link. Use when caller wants to schedule a meeting or callback.',
    input_schema: {
      type: 'object',
      properties: {
        dateTime: { type: 'string', description: 'Requested date/time in ISO format (e.g., 2024-03-15T14:00:00)' },
        durationMins: { type: 'number', description: 'Duration in minutes (default 30)' },
        purpose: { type: 'string', description: 'Purpose of the appointment' },
        contact: { type: 'string', description: 'Caller phone number to send SMS confirmation' },
        email: { type: 'string', description: 'Caller email for calendar invite' }
      }
    }
  },
  {
    name: 'takeMessage',
    description: 'Take a voicemail message from the caller',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        details: { type: 'string' },
        contact: { type: 'string' }
      }
    }
  },
  {
    name: 'answerQuestion',
    description: 'Answer general questions using the knowledge base',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to answer' },
        language: { type: 'string', description: 'Language code (en, es, etc)' }
      },
      required: ['question']
    }
  },
  {
    name: 'sendTextMessage',
    description: 'Send an SMS text message to a phone number. Use this when the caller requests information be texted to them, or to send links that are hard to communicate verbally.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number to send SMS to' },
        message: { type: 'string', description: 'The text message content to send' }
      },
      required: ['to', 'message']
    }
  }
];
