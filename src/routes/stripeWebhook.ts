import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { handlePaymentSuccess, handlePaymentFailed } from '../services/payments.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !endpointSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return res.status(400).send('Missing signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntentSucceeded);
      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntentFailed);
      break;

    case 'charge.refunded':
      const chargeRefunded = event.data.object as Stripe.Charge;
      console.log('Charge refunded:', chargeRefunded.id);
      // Handle refund logic here
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
