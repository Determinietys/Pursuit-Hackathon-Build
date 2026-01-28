/**
 * SnowClear Booking Accept API
 * POST /api/snowclear/bookings/[id]/accept
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { BookingService } from '@/lib/services/booking.service';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Feature flag check
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
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

    // Get provider profile for this user
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider profile not found' },
        { status: 404 }
      );
    }

    const booking = await BookingService.acceptBooking(
      params.id,
      provider.id
    );

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Booking accept error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept booking' },
      { status: 500 }
    );
  }
}

