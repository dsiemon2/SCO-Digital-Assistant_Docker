import { Router } from 'express';
import twilio from 'twilio';
import { prisma } from '../db/prisma.js';
import { enqueueTranscription } from '../queues/enqueue.js';

const router = Router();
const { VoiceResponse } = twilio.twiml;

// Main voice entry point
router.post('/voice', async (_req, res) => {
  const twiml = new VoiceResponse();

  twiml.say({ voice: 'Polly.Joanna' },
    'Thank you for calling The Soup Cookoff! This call may be recorded. How can I help you today?'
  );

  const gather = twiml.gather({
    input: ['speech', 'dtmf'],
    numDigits: 1,
    speechTimeout: 'auto',
    action: '/voice/route',
    method: 'POST',
  });

  gather.say({ voice: 'Polly.Joanna' },
    'Press 1 for event information. ' +
    'Press 2 to purchase tickets. ' +
    'Press 3 for sponsorship information. ' +
    'Press 4 to enter as a chef. ' +
    'Press 0 to speak with someone. ' +
    'Or press 9 for our voice assistant.'
  );

  res.type('text/xml').send(twiml.toString());
});

// Route based on DTMF or speech input
router.post('/voice/route', async (req, res) => {
  const twiml = new VoiceResponse();
  const { Digits, SpeechResult } = req.body || {};
  const slot = (Digits || '').trim();
  const speech = (SpeechResult || '').toLowerCase();

  // Voice Assistant (AI conversation)
  if (slot === '9' || /assistant|ai|voice|help/i.test(speech)) {
    const connect = twiml.connect();
    const baseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') || '';
    connect.stream({ url: `${baseUrl}/media` });
    twiml.say({ voice: 'Polly.Joanna' },
      'Connecting you to our voice assistant. One moment please.'
    );
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Event Information
  if (slot === '1' || /event|when|where|date|location|next/i.test(speech)) {
    const events = await prisma.event.findMany({
      where: { active: true, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 2
    });

    if (events.length > 0) {
      const event = events[0];
      const dateStr = event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      twiml.say({ voice: 'Polly.Joanna' },
        `Our next Soup Cookoff is the ${event.name} on ${dateStr} at ${event.location}. ` +
        `General admission is $${event.gaPriceOnline} online or $${event.gaPriceGate} at the gate. ` +
        `VIP tickets are $${event.vipPriceOnline} online. ` +
        `Would you like to purchase tickets? Press 2 now, or visit soup cook off dot com.`
      );
    } else {
      twiml.say({ voice: 'Polly.Joanna' },
        'We don\'t have any upcoming events scheduled right now. ' +
        'Please visit soup cook off dot com for the latest information.'
      );
    }
    twiml.redirect('/voice');
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Purchase Tickets
  if (slot === '2' || /ticket|buy|purchase|order/i.test(speech)) {
    twiml.say({ voice: 'Polly.Joanna' },
      'To purchase tickets with a credit card, press 9 to speak with our voice assistant, ' +
      'or visit soup cook off dot com slash tickets. ' +
      'Online prices are lower than at the gate!'
    );
    twiml.redirect('/voice');
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Sponsorship
  if (slot === '3' || /sponsor|sponsorship|vendor|booth/i.test(speech)) {
    twiml.say({ voice: 'Polly.Joanna' },
      'We have four sponsorship levels ranging from $250 to $2,500. ' +
      'Benefits include vendor booths, program advertising, complimentary tickets, and more. ' +
      'For details, press 9 to speak with our assistant, visit soup cook off dot com slash sponsor, ' +
      'or press 0 to speak with our team.'
    );
    twiml.redirect('/voice');
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Chef Registration
  if (slot === '4' || /chef|enter|compete|cook|register/i.test(speech)) {
    twiml.say({ voice: 'Polly.Joanna' },
      'We have three chef divisions: Professional, Amateur at $25, and Junior. ' +
      'To register, visit soup cook off dot com slash chef entry. ' +
      'Space is limited, so register early!'
    );
    twiml.redirect('/voice');
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Transfer to Human
  if (slot === '0' || /human|person|agent|talk|speak|someone|transfer/i.test(speech)) {
    twiml.say({ voice: 'Polly.Joanna' }, 'Transferring you now. Please hold.');
    if (process.env.TWILIO_AGENT_TRANSFER_NUMBER) {
      twiml.dial(process.env.TWILIO_AGENT_TRANSFER_NUMBER);
    } else {
      twiml.say({ voice: 'Polly.Joanna' },
        'I\'m sorry, no one is available right now. ' +
        'Please leave a message after the tone, or contact us at soup cook off dot com.'
      );
      twiml.record({
        maxLength: 120,
        playBeep: true,
        transcribe: true,
        transcribeCallback: '/voice/voicemail',
        finishOnKey: '#'
      });
    }
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Voicemail
  if (/message|voicemail|leave/i.test(speech)) {
    twiml.say({ voice: 'Polly.Joanna' },
      'Please leave your message after the tone. Press pound when finished.'
    );
    twiml.record({
      maxLength: 120,
      playBeep: true,
      transcribe: true,
      transcribeCallback: '/voice/voicemail',
      finishOnKey: '#'
    });
    res.type('text/xml').send(twiml.toString());
    return;
  }

  // Default - didn't understand
  twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, I didn\'t catch that.');
  twiml.redirect('/voice');
  res.type('text/xml').send(twiml.toString());
});

// Voicemail callback
router.post('/voice/voicemail', async (req, res) => {
  console.log('Voicemail received:', req.body?.TranscriptionText);

  try {
    await enqueueTranscription({
      recordingUrl: req.body?.RecordingUrl,
      callSid: req.body?.CallSid
    });
  } catch (err) {
    console.error('Failed to enqueue transcription:', err);
  }

  const twiml = new VoiceResponse();
  twiml.say({ voice: 'Polly.Joanna' },
    'Thank you! Your message has been received. We\'ll get back to you soon.'
  );
  twiml.hangup();
  res.type('text/xml').send(twiml.toString());
});

// Call status webhook
router.post('/voice/status', async (req, res) => {
  const { CallSid, From, To, CallStatus } = req.body || {};

  // Upsert call log
  let call = await prisma.callLog.findUnique({
    where: { callSid: CallSid || '' }
  });

  if (!call) {
    try {
      call = await prisma.callLog.create({
        data: {
          callSid: CallSid || 'unknown',
          fromNumber: From || 'unknown',
          toNumber: To || 'unknown',
        }
      });
    } catch (err) {
      console.error('Failed to create call log:', err);
    }
  }

  // Update on call end
  const endedStatuses = new Set(['completed', 'busy', 'no-answer', 'canceled', 'failed']);
  if (CallStatus && endedStatuses.has(String(CallStatus))) {
    await prisma.callLog.update({
      where: { callSid: CallSid },
      data: { endedAt: new Date(), outcome: String(CallStatus) }
    }).catch(() => {});
  }

  res.status(204).end();
});

export default router;
