import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/services/payment.service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

