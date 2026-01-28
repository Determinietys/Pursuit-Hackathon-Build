import { render, screen } from '@testing-library/react';
import { EarningsDisplay } from '@/components/payments/EarningsDisplay';

describe('EarningsDisplay Component', () => {
  it('should display net earnings correctly', () => {
    const booking = {
      subtotal: 10000,
      platformFee: 3000,
      providerPayout: 7000,
    };

    render(<EarningsDisplay booking={booking} />);

    expect(screen.getByText('$70.00')).toBeInTheDocument();
    expect(screen.getByText('Your Earnings')).toBeInTheDocument();
  });

  it('should show breakdown when showBreakdown is true', () => {
    const booking = {
      subtotal: 10000,
      platformFee: 3000,
      providerPayout: 7000,
    };

    render(<EarningsDisplay booking={booking} showBreakdown={true} />);

    expect(screen.getByText('Service Total')).toBeInTheDocument();
    expect(screen.getByText('Platform Fee (30%)')).toBeInTheDocument();
    expect(screen.getByText('You Receive')).toBeInTheDocument();
  });

  it('should not show breakdown when showBreakdown is false', () => {
    const booking = {
      subtotal: 10000,
      platformFee: 3000,
      providerPayout: 7000,
    };

    render(<EarningsDisplay booking={booking} showBreakdown={false} />);

    expect(screen.queryByText('Service Total')).not.toBeInTheDocument();
  });

  it('should handle zero earnings', () => {
    const booking = {
      subtotal: 0,
      platformFee: 0,
      providerPayout: 0,
    };

    render(<EarningsDisplay booking={booking} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});

