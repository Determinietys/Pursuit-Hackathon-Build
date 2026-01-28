import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Platform fee percentage (30%)
const PLATFORM_FEE_PERCENT = 30;

export class PaymentService {
  /**
   * Calculate pricing breakdown
   * Customer sees: subtotal (what they pay)
   * Provider sees: net payout (70% of subtotal)
   */
  static calculatePricing(basePrice: number, additionalCharges: number = 0) {
    const subtotal = basePrice + additionalCharges;
    const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));
    const providerPayout = subtotal - platformFee;
    
    return {
      basePrice,           // Base service price
      additionalCharges,   // Extra charges (depth, size, etc.)
      subtotal,            // Total customer pays
      platformFee,         // 30% platform cut
      providerPayout,      // 70% - what provider receives (NET)
      customerTotal: subtotal,
    };
  }

  /**
   * Create Stripe Connect Express account for provider
   */
  static async createConnectAccount(
    userId: string,
    email: string,
    businessProfile?: {
      businessName?: string;
      businessType?: 'individual' | 'company';
    }
  ): Promise<{ accountId: string; onboardingUrl: string }> {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessProfile?.businessType || 'individual',
      business_profile: {
        name: businessProfile?.businessName,
        mcc: '7349', // Cleaning services
        product_description: 'Snow removal and winter property maintenance services',
      },
      metadata: {
        userId,
        platform: 'snowclear',
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding/complete`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  /**
   * Create payment intent with automatic transfer to provider
   */
  static async createPaymentIntent(
    booking: {
      id: string;
      customerTotal: number;
      platformFee: number;
      providerPayout: number;
    },
    customerId: string,
    providerStripeAccountId: string
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.customerTotal, // Amount in cents
      currency: 'usd',
      customer: customerId,
      // Automatic transfer to connected account
      transfer_data: {
        destination: providerStripeAccountId,
        amount: booking.providerPayout, // 70% goes to provider
      },
      metadata: {
        bookingId: booking.id,
        platformFee: booking.platformFee.toString(),
        providerPayout: booking.providerPayout.toString(),
      },
      // Capture immediately when confirmed
      capture_method: 'automatic',
    });

    return paymentIntent;
  }

  /**
   * Get or create Stripe customer
   */
  static async getOrCreateCustomer(
    userId: string,
    email: string,
    name: string
  ): Promise<string> {
    // Check if customer exists
    const existing = await prisma.customerProfile.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId, platform: 'snowclear' },
    });

    // Save to database
    await prisma.customerProfile.upsert({
      where: { userId },
      update: { stripeCustomerId: customer.id },
      create: { userId, stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Capture payment
   */
  static async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.capture(paymentIntentId);
  }

  /**
   * Handle refunds with platform fee consideration
   */
  static async processRefund(
    paymentIntentId: string,
    refundType: 'full' | 'partial',
    partialAmount?: number
  ): Promise<Stripe.Refund> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (refundType === 'full') {
      // Full refund - reverse the transfer too
      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reverse_transfer: true,
      });
    } else {
      // Partial refund
      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: partialAmount,
        // Calculate proportional transfer reversal
        reverse_transfer: true,
      });
    }
  }

  /**
   * Get provider's payout history
   */
  static async getProviderPayouts(
    stripeAccountId: string,
    limit: number = 10
  ): Promise<Stripe.Payout[]> {
    const payouts = await stripe.payouts.list(
      { limit },
      { stripeAccount: stripeAccountId }
    );
    return payouts.data;
  }

  /**
   * Get provider's balance
   */
  static async getProviderBalance(stripeAccountId: string): Promise<{
    available: number;
    pending: number;
  }> {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    return {
      available: balance.available.find(b => b.currency === 'usd')?.amount || 0,
      pending: balance.pending.find(b => b.currency === 'usd')?.amount || 0,
    };
  }
}

