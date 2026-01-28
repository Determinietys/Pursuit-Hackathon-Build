import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookingService } from '@/lib/services/booking.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'customer'; // 'customer' or 'provider'

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
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

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
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

