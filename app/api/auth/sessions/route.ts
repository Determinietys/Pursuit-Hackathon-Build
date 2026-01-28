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

    // Get all active sessions for user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expires: { gt: new Date() },
      },
      orderBy: { expires: 'desc' },
    });

    // Format sessions
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      device: 'Web Browser', // Could be enhanced with device detection
      lastActive: s.expires,
      current: s.sessionToken === session.user.id, // Simplified check
    }));

    return NextResponse.json(formattedSessions);
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

