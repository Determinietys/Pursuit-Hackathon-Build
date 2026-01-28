import { BookingService } from '@/lib/services/booking.service';

describe('BookingService', () => {
  describe('formatProviderEarnings', () => {
    it('should format earnings correctly showing net amount', () => {
      const mockBooking = {
        id: 'test-id',
        subtotal: 10000,
        platformFee: 3000,
        providerPayout: 7000,
      } as any;

      const result = BookingService.formatProviderEarnings(mockBooking);

      expect(result.displayAmount).toBe('$70.00');
      expect(result.grossAmount).toBe(10000);
      expect(result.netAmount).toBe(7000);
      expect(result.platformFee).toBe(3000);
      expect(result.platformFeePercent).toBe(30);
    });

    it('should handle zero earnings', () => {
      const mockBooking = {
        id: 'test-id',
        subtotal: 0,
        platformFee: 0,
        providerPayout: 0,
      } as any;

      const result = BookingService.formatProviderEarnings(mockBooking);

      expect(result.displayAmount).toBe('$0.00');
    });
  });
});

