/**
 * SnowClear Bookings API
 * GET, POST /api/snowclear/bookings
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 * All functionality is behind feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { BookingService } from '@/lib/services/booking.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/snowclear/bookings
 * List bookings for current user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Feature flag check FIRST
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    // 2. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Check customer booking flag for POST operations
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'customer';

    const where: any = {};
    if (role === 'customer') {
      where.customerId = session.user.id;
    } else {
      where.providerId = {
        in: await prisma.providerProfile
          .findMany({
            where: { userId: session.user.id },
            select: { id: true },
          })
          .then(providers => providers.map(p => p.id)),
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        address: {
          include: { city: true },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Bookings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/snowclear/bookings
 * Create new booking
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Feature flag check FIRST
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const customerBookingEnabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.CUSTOMER_BOOKING);
    if (!customerBookingEnabled) {
      return NextResponse.json(
        { error: 'Feature not available' },
        { status: 404 }
      );
    }

    // 2. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const {
      providerId,
      addressId,
      serviceType,
      scheduledDate,
      scheduledTimeStart,
      scheduledTimeEnd,
      snowDepthInches,
      isEmergency,
      customerNotes,
    } = body;

    // 4. Business logic (isolated service)
    const booking = await BookingService.createBooking({
      customerId: session.user.id,
      providerId,
      addressId,
      serviceType,
      scheduledDate: new Date(scheduledDate),
      scheduledTimeStart,
      scheduledTimeEnd,
      snowDepthInches,
      isEmergency,
      customerNotes,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('[SNOWCLEAR] Bookings POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

