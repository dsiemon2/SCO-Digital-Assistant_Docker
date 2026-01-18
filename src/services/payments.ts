import Stripe from 'stripe';
import { prisma } from '../db/prisma.js';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface TicketPurchaseRequest {
  eventId: string;
  ticketType: 'GA' | 'VIP';
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callLogId?: string;
}

export interface PaymentResult {
  success: boolean;
  confirmationCode?: string;
  error?: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

/**
 * Create a payment intent for ticket purchase
 */
export async function createTicketPaymentIntent(
  request: TicketPurchaseRequest
): Promise<PaymentResult> {
  try {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: request.eventId }
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (!event.active) {
      return { success: false, error: 'Event is not available for ticket sales' };
    }

    // Calculate price
    const unitPrice = request.ticketType === 'VIP'
      ? Number(event.vipPriceOnline)
      : Number(event.gaPriceOnline);

    const totalPrice = unitPrice * request.quantity;
    const totalCents = Math.round(totalPrice * 100);

    // Check availability
    const sold = request.ticketType === 'VIP' ? event.vipSold : event.gaSold;
    const capacity = request.ticketType === 'VIP' ? event.vipCapacity : event.gaCapacity;

    if (sold + request.quantity > capacity) {
      return { success: false, error: `Only ${capacity - sold} ${request.ticketType} tickets remaining` };
    }

    // Generate confirmation code
    const confirmationCode = `SCO-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId: request.eventId,
        ticketType: request.ticketType,
        quantity: request.quantity.toString(),
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        confirmationCode: confirmationCode,
      },
      receipt_email: request.customerEmail,
      description: `${request.quantity}x ${request.ticketType} Ticket(s) - ${event.name}`,
    });

    // Create pending ticket purchase record
    await prisma.ticketPurchase.create({
      data: {
        eventId: request.eventId,
        ticketType: request.ticketType,
        quantity: request.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        stripePaymentId: paymentIntent.id,
        paymentStatus: 'pending',
        confirmationCode: confirmationCode,
        callLogId: request.callLogId || null,
      }
    });

    return {
      success: true,
      confirmationCode,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    return { success: false, error: error.message || 'Payment processing failed' };
  }
}

/**
 * Process payment for voice assistant (simplified card details)
 */
export async function processVoicePayment(args: {
  eventId: string;
  ticketType: 'GA' | 'VIP';
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  callLogId?: string;
}): Promise<PaymentResult> {
  try {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: args.eventId }
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Calculate price
    const unitPrice = args.ticketType === 'VIP'
      ? Number(event.vipPriceOnline)
      : Number(event.gaPriceOnline);

    const totalPrice = unitPrice * args.quantity;
    const totalCents = Math.round(totalPrice * 100);

    // Generate confirmation code
    const confirmationCode = `SCO-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create payment method from card details
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: args.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(args.expMonth),
        exp_year: parseInt(args.expYear.length === 2 ? `20${args.expYear}` : args.expYear),
        cvc: args.cvc,
      },
    });

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        eventId: args.eventId,
        ticketType: args.ticketType,
        quantity: args.quantity.toString(),
        confirmationCode: confirmationCode,
      },
      receipt_email: args.customerEmail,
      description: `${args.quantity}x ${args.ticketType} Ticket(s) - ${event.name}`,
    });

    if (paymentIntent.status === 'succeeded') {
      // Create successful ticket purchase
      await prisma.ticketPurchase.create({
        data: {
          eventId: args.eventId,
          ticketType: args.ticketType,
          quantity: args.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          customerName: args.customerName,
          customerEmail: args.customerEmail,
          customerPhone: args.customerPhone,
          stripePaymentId: paymentIntent.id,
          paymentStatus: 'completed',
          confirmationCode: confirmationCode,
          callLogId: args.callLogId || null,
        }
      });

      // Update event ticket counts
      if (args.ticketType === 'VIP') {
        await prisma.event.update({
          where: { id: args.eventId },
          data: { vipSold: { increment: args.quantity } }
        });
      } else {
        await prisma.event.update({
          where: { id: args.eventId },
          data: { gaSold: { increment: args.quantity } }
        });
      }

      return { success: true, confirmationCode };
    } else {
      return { success: false, error: 'Payment requires additional action' };
    }
  } catch (error: any) {
    console.error('Voice payment processing failed:', error);
    return { success: false, error: error.message || 'Payment declined' };
  }
}

/**
 * Handle successful payment webhook
 */
export async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { metadata } = paymentIntent;

  if (!metadata?.confirmationCode) {
    console.error('Missing confirmation code in payment metadata');
    return;
  }

  // Update ticket purchase status
  await prisma.ticketPurchase.updateMany({
    where: { stripePaymentId: paymentIntent.id },
    data: { paymentStatus: 'completed' }
  });

  // Update event ticket counts
  const eventId = metadata.eventId;
  const ticketType = metadata.ticketType;
  const quantity = parseInt(metadata.quantity || '1');

  if (ticketType === 'VIP') {
    await prisma.event.update({
      where: { id: eventId },
      data: { vipSold: { increment: quantity } }
    });
  } else {
    await prisma.event.update({
      where: { id: eventId },
      data: { gaSold: { increment: quantity } }
    });
  }

  console.log(`Payment successful: ${metadata.confirmationCode}`);
}

/**
 * Handle failed payment webhook
 */
export async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  await prisma.ticketPurchase.updateMany({
    where: { stripePaymentId: paymentIntent.id },
    data: { paymentStatus: 'failed' }
  });

  console.log(`Payment failed: ${paymentIntent.id}`);
}

/**
 * Get ticket prices for an event
 */
export async function getTicketPrices(eventId?: string): Promise<{
  event: any;
  gaOnline: number;
  gaGate: number;
  vipOnline: number;
  vipGate: number;
  gaAvailable: number;
  vipAvailable: number;
} | null> {
  const event = eventId
    ? await prisma.event.findUnique({ where: { id: eventId } })
    : await prisma.event.findFirst({
        where: { active: true, date: { gte: new Date() } },
        orderBy: { date: 'asc' }
      });

  if (!event) return null;

  return {
    event,
    gaOnline: Number(event.gaPriceOnline),
    gaGate: Number(event.gaPriceGate),
    vipOnline: Number(event.vipPriceOnline),
    vipGate: Number(event.vipPriceGate),
    gaAvailable: event.gaCapacity - event.gaSold,
    vipAvailable: event.vipCapacity - event.vipSold,
  };
}
