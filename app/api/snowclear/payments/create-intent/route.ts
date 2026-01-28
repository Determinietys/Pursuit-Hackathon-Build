/**
 * SnowClear Payment Intent API
 * POST /api/snowclear/payments/create-intent
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { PaymentService } from '@/lib/services/payment.service';
import { prisma } from '@/lib/prisma';

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

    const paymentsEnabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.PAYMENTS);
    if (!paymentsEnabled) {
      return NextResponse.json(
        { error: 'Payments feature not available' },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: { customerProfile: true },
        },
        provider: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!booking.provider.stripeAccountId) {
      return NextResponse.json(
        { error: 'Provider has not completed onboarding' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await PaymentService.getOrCreateCustomer(
      booking.customerId,
      booking.customer.email,
      `${booking.customer.firstName} ${booking.customer.lastName}`
    );

    // Create payment intent
    const paymentIntent = await PaymentService.createPaymentIntent(
      {
        id: booking.id,
        customerTotal: booking.customerTotal,
        platformFee: booking.platformFee,
        providerPayout: booking.providerPayout,
      },
      customerId,
      booking.provider.stripeAccountId
    );

    // Update booking with payment intent ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'AUTHORIZED',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('[SNOWCLEAR] Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

