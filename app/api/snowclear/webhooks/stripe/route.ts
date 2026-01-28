/**
 * SnowClear Stripe Webhook Handler
 * POST /api/snowclear/webhooks/stripe
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.SNOWCLEAR_STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || process.env.SNOWCLEAR_STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('[SNOWCLEAR] Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        await prisma.providerProfile.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeAccountStatus: account.details_submitted ? 'ACTIVE' : 'ONBOARDING',
            stripeOnboardingComplete: account.details_submitted,
          },
        });
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.booking.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { paymentStatus: 'CAPTURED' },
        });
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await prisma.booking.updateMany({
          where: { stripePaymentIntentId: failedPayment.id },
          data: { paymentStatus: 'FAILED' },
        });
        break;

      default:
        console.log(`[SNOWCLEAR] Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[SNOWCLEAR] Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

