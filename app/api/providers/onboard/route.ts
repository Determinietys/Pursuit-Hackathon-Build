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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get or create provider profile
    let provider = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!provider) {
      provider = await prisma.providerProfile.create({
        data: {
          userId: session.user.id,
          baseHourlyRate: 0,
          minimumCharge: 0,
        },
      });
    }

    // If already has Stripe account, return existing onboarding URL
    if (provider.stripeAccountId && !provider.stripeOnboardingComplete) {
      const accountLink = await PaymentService.createConnectAccount(
        session.user.id,
        user.email
      );
      return NextResponse.json({ onboardingUrl: accountLink.onboardingUrl });
    }

    // Create new Stripe Connect account
    const { accountId, onboardingUrl } = await PaymentService.createConnectAccount(
      session.user.id,
      user.email
    );

    // Update provider with Stripe account ID
    await prisma.providerProfile.update({
      where: { id: provider.id },
      data: {
        stripeAccountId: accountId,
        stripeAccountStatus: 'ONBOARDING',
      },
    });

    return NextResponse.json({ onboardingUrl });
  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to start onboarding' },
      { status: 500 }
    );
  }
}

