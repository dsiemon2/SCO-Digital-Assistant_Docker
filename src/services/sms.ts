import twilio from 'twilio';
import pino from 'pino';

const logger = pino();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_VOICE_NUMBER;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

export interface SMSOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, body, mediaUrl } = options;

  // Validate phone number format
  const cleanPhone = to.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

  try {
    const messageOptions: any = {
      to: formattedPhone,
      body,
    };

    // Use messaging service if configured, otherwise use from number
    if (MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = MESSAGING_SERVICE_SID;
    } else if (FROM_NUMBER) {
      messageOptions.from = FROM_NUMBER;
    } else {
      return { success: false, error: 'No SMS sender configured' };
    }

    // Add media URL if provided (for MMS)
    if (mediaUrl && mediaUrl.length > 0) {
      messageOptions.mediaUrl = mediaUrl;
    }

    const message = await twilioClient.messages.create(messageOptions);

    logger.info({ sid: message.sid, to: formattedPhone }, 'SMS sent successfully');
    return { success: true, sid: message.sid };
  } catch (err: any) {
    logger.error({ err, to: formattedPhone }, 'Failed to send SMS');
    return { success: false, error: err.message };
  }
}

/**
 * Send ticket confirmation SMS
 */
export async function sendTicketConfirmation(options: {
  to: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  confirmationCode: string;
  totalPrice: string;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, customerName, eventName, eventDate, eventLocation, ticketType, quantity, confirmationCode, totalPrice } = options;

  const body = `Soup Cook Off Ticket Confirmation

Hi ${customerName}!

Your tickets are confirmed:
- Event: ${eventName}
- Date: ${eventDate}
- Location: ${eventLocation}
- Tickets: ${quantity}x ${ticketType}
- Total: ${totalPrice}
- Confirmation: ${confirmationCode}

Show this text at the door or visit soupcookoff.com/tickets to download.

Questions? Reply to this text or call us back.

Thank you for supporting the AKT Foundation!`;

  return sendSMS({ to, body });
}

/**
 * Send sponsor inquiry follow-up SMS
 */
export async function sendSponsorFollowUp(options: {
  to: string;
  contactName: string;
  companyName?: string;
  tier: string;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, contactName, companyName, tier } = options;

  const body = `Hi ${contactName}!

Thank you for your interest in sponsoring The Soup Cook Off${companyName ? ` on behalf of ${companyName}` : ''}.

You inquired about our ${tier} sponsorship package. A member of our team will reach out within 24 hours to discuss the details.

In the meantime, visit soupcookoff.com/sponsor for more info.

- The Soup Cook Off Team`;

  return sendSMS({ to, body });
}

/**
 * Send event reminder SMS
 */
export async function sendEventReminder(options: {
  to: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  ticketType: string;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, customerName, eventName, eventDate, eventTime, eventLocation, eventAddress, ticketType } = options;

  const body = `Hi ${customerName}!

Reminder: ${eventName} is tomorrow!

Date: ${eventDate}
Time: ${eventTime}${ticketType === 'VIP' ? ' (VIP Early Entry: 30 min before)' : ''}
Location: ${eventLocation}
Address: ${eventAddress}

Don't forget to bring your confirmation text or email!

See you there!
- The Soup Cook Off Team`;

  return sendSMS({ to, body });
}

/**
 * Send voicemail notification SMS
 */
export async function sendVoicemailNotification(options: {
  to: string;
  callerPhone: string;
  transcript?: string;
  timestamp: string;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { to, callerPhone, transcript, timestamp } = options;

  let body = `New voicemail received!

From: ${callerPhone}
Time: ${timestamp}`;

  if (transcript) {
    body += `\n\nTranscript:\n"${transcript.substring(0, 300)}${transcript.length > 300 ? '...' : ''}"`;
  }

  body += `\n\nCheck the admin dashboard for full details.`;

  return sendSMS({ to, body });
}

export default {
  sendSMS,
  sendTicketConfirmation,
  sendSponsorFollowUp,
  sendEventReminder,
  sendVoicemailNotification
};
