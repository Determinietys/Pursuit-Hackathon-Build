import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format cents to currency string', () => {
      expect(formatCurrency(10000)).toBe('$100.00');
      expect(formatCurrency(1234)).toBe('$12.34');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$10,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000)).toBe('-$10.00');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toContain('January');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });
  });
});

