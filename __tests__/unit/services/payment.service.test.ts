import { PaymentService } from '@/lib/services/payment.service';

describe('PaymentService', () => {
  describe('calculatePricing', () => {
    it('should calculate correct pricing breakdown with 30% platform fee', () => {
      const basePrice = 10000; // $100.00 in cents
      const additionalCharges = 2000; // $20.00 in cents
      
      const result = PaymentService.calculatePricing(basePrice, additionalCharges);
      
      expect(result.basePrice).toBe(10000);
      expect(result.additionalCharges).toBe(2000);
      expect(result.subtotal).toBe(12000);
      expect(result.platformFee).toBe(3600); // 30% of 12000
      expect(result.providerPayout).toBe(8400); // 70% of 12000
      expect(result.customerTotal).toBe(12000);
    });

    it('should handle zero additional charges', () => {
      const basePrice = 5000;
      const result = PaymentService.calculatePricing(basePrice, 0);
      
      expect(result.subtotal).toBe(5000);
      expect(result.platformFee).toBe(1500);
      expect(result.providerPayout).toBe(3500);
    });

    it('should round platform fee correctly', () => {
      const basePrice = 3333; // Will result in non-integer fee
      const result = PaymentService.calculatePricing(basePrice);
      
      expect(result.platformFee).toBe(1000); // Rounded from 999.9
      expect(result.providerPayout).toBe(2333);
    });

    it('should handle edge case of very small amounts', () => {
      const basePrice = 1; // $0.01
      const result = PaymentService.calculatePricing(basePrice);
      
      expect(result.platformFee).toBe(0); // Rounded down
      expect(result.providerPayout).toBe(1);
    });
  });
});

