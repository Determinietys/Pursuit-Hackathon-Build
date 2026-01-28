import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customerProfile: true,
        providerProfile: true,
        addresses: true,
        bookingsAsCustomer: true,
        reviews: true,
        notifications: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { passwordHash, ...safeUserData } = user;

    // Return as JSON download
    return new NextResponse(JSON.stringify(safeUserData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="snowclear-data-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

