import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookingService } from '@/lib/services/booking.service';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { afterPhotoUrl, providerNotes } = body;

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

    const booking = await BookingService.completeJob(
      params.id,
      provider.id,
      afterPhotoUrl,
      providerNotes
    );

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error('Error completing booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete booking' },
      { status: 500 }
    );
  }
}

