import { prisma } from '@/lib/prisma';
import { PaymentService } from './payment.service';
import { NotificationService } from './notification.service';
import { 
  Booking, 
  BookingStatus, 
  PaymentStatus,
  ServiceType 
} from '@prisma/client';

export class BookingService {
  /**
   * Create a new booking request
   */
  static async createBooking(data: {
    customerId: string;
    providerId: string;
    addressId: string;
    serviceType: ServiceType;
    scheduledDate: Date;
    scheduledTimeStart: string;
    scheduledTimeEnd?: string;
    snowDepthInches?: number;
    isEmergency?: boolean;
    customerNotes?: string;
  }): Promise<Booking> {
    // Get provider pricing
    const provider = await prisma.providerProfile.findUnique({
      where: { id: data.providerId },
      include: {
        pricing: true,
        user: true,
      },
    });

    if (!provider) throw new Error('Provider not found');
    if (!provider.isAvailable) throw new Error('Provider is not available');

    // Get address for property details
    const address = await prisma.address.findUnique({
      where: { id: data.addressId },
    });

    if (!address) throw new Error('Address not found');

    // Calculate pricing
    const pricing = provider.pricing.find(
      p => p.serviceType === data.serviceType && p.propertyType === address.propertyType
    );

    const basePrice = pricing 
      ? Number(pricing.basePrice) * 100 // Convert to cents
      : Number(provider.minimumCharge) * 100;

    // Additional charges for deep snow
    let additionalCharges = 0;
    if (data.snowDepthInches && data.snowDepthInches > 6 && pricing?.pricePerInch) {
      const extraInches = data.snowDepthInches - 6;
      additionalCharges = Math.round(Number(pricing.pricePerInch) * extraInches * 100);
    }

    // Emergency surcharge (50%)
    if (data.isEmergency) {
      additionalCharges += Math.round(basePrice * 0.5);
    }

    // Calculate full pricing breakdown
    const pricingBreakdown = PaymentService.calculatePricing(
      basePrice,
      additionalCharges
    );

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        customerId: data.customerId,
        providerId: data.providerId,
        addressId: data.addressId,
        serviceType: data.serviceType,
        scheduledDate: data.scheduledDate,
        scheduledTimeStart: data.scheduledTimeStart,
        scheduledTimeEnd: data.scheduledTimeEnd,
        snowDepthInches: data.snowDepthInches,
        isEmergency: data.isEmergency || false,
        customerNotes: data.customerNotes,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        ...pricingBreakdown,
        statusHistory: [{
          status: BookingStatus.PENDING,
          timestamp: new Date().toISOString(),
          note: 'Booking created',
        }],
      },
      include: {
        customer: true,
        provider: { include: { user: true } },
        address: { include: { city: true } },
      },
    });

    // Notify provider of new booking request
    await NotificationService.send({
      userId: provider.userId,
      type: 'BOOKING_REQUEST',
      title: 'New Booking Request',
      body: `You have a new ${data.serviceType} request for ${data.scheduledDate.toLocaleDateString()}`,
      data: { bookingId: booking.id },
    });

    return booking;
  }

  /**
   * Provider accepts booking
   */
  static async acceptBooking(
    bookingId: string,
    providerId: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        customer: true,
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.providerId !== providerId) throw new Error('Unauthorized');
    if (booking.status !== BookingStatus.PENDING) {
      throw new Error('Booking cannot be accepted in current status');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.ACCEPTED,
        statusHistory: {
          push: {
            status: BookingStatus.ACCEPTED,
            timestamp: new Date().toISOString(),
            note: 'Provider accepted booking',
          },
        },
      },
    });

    // Notify customer
    await NotificationService.send({
      userId: booking.customerId,
      type: 'BOOKING_ACCEPTED',
      title: 'Booking Accepted!',
      body: `${booking.provider.user.firstName} has accepted your booking`,
      data: { bookingId },
    });

    return updated;
  }

  /**
   * Provider starts the job
   */
  static async startJob(
    bookingId: string,
    providerId: string,
    beforePhotoUrl?: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.providerId !== providerId) throw new Error('Unauthorized');
    if (booking.status !== BookingStatus.ACCEPTED && 
        booking.status !== BookingStatus.SCHEDULED &&
        booking.status !== BookingStatus.PROVIDER_EN_ROUTE) {
      throw new Error('Cannot start job in current status');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.IN_PROGRESS,
        startedAt: new Date(),
        beforePhotoUrl,
        statusHistory: {
          push: {
            status: BookingStatus.IN_PROGRESS,
            timestamp: new Date().toISOString(),
            note: 'Provider started work',
          },
        },
      },
    });

    // Notify customer
    await NotificationService.send({
      userId: booking.customerId,
      type: 'JOB_STARTED',
      title: 'Work Has Started',
      body: 'Your provider has begun the snow removal service',
      data: { bookingId },
    });

    return updated;
  }

  /**
   * Provider completes the job - triggers payment
   */
  static async completeJob(
    bookingId: string,
    providerId: string,
    afterPhotoUrl?: string,
    providerNotes?: string
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
        customer: { include: { customerProfile: true } },
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.providerId !== providerId) throw new Error('Unauthorized');
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new Error('Cannot complete job in current status');
    }

    // Capture payment
    if (booking.stripePaymentIntentId) {
      try {
        await PaymentService.capturePayment(booking.stripePaymentIntentId);
      } catch (error) {
        console.error('Payment capture failed:', error);
        throw new Error('Payment processing failed');
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
        afterPhotoUrl,
        providerNotes,
        paymentStatus: PaymentStatus.CAPTURED,
        statusHistory: {
          push: {
            status: BookingStatus.COMPLETED,
            timestamp: new Date().toISOString(),
            note: 'Job completed',
          },
        },
      },
    });

    // Update provider stats
    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        completedJobs: { increment: 1 },
      },
    });

    // Notify customer
    await NotificationService.send({
      userId: booking.customerId,
      type: 'JOB_COMPLETED',
      title: 'Service Complete!',
      body: 'Your snow removal is complete. Please leave a review!',
      data: { bookingId },
    });

    // Notify provider of payment
    await NotificationService.send({
      userId: booking.provider.userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      body: `You earned $${(booking.providerPayout / 100).toFixed(2)} for this job`,
      data: { bookingId, amount: booking.providerPayout },
    });

    return updated;
  }

  /**
   * Calculate provider earnings for display
   * Shows NET amount (after 30% platform fee)
   */
  static formatProviderEarnings(booking: Booking): {
    displayAmount: string;
    grossAmount: number;
    netAmount: number;
    platformFee: number;
    platformFeePercent: number;
  } {
    return {
      displayAmount: `$${(booking.providerPayout / 100).toFixed(2)}`,
      grossAmount: booking.subtotal,
      netAmount: booking.providerPayout,
      platformFee: booking.platformFee,
      platformFeePercent: 30,
    };
  }
}

