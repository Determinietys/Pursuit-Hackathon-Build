interface EarningsDisplayProps {
  booking: {
    subtotal: number;
    platformFee: number;
    providerPayout: number;
  };
  showBreakdown?: boolean;
}

export function EarningsDisplay({ booking, showBreakdown = false }: EarningsDisplayProps) {
  const netEarnings = booking.providerPayout / 100;
  
  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <div className="flex items-center justify-between">
        <span className="text-sm text-green-700 font-medium">Your Earnings</span>
        <span className="text-2xl font-bold text-green-800">
          ${netEarnings.toFixed(2)}
        </span>
      </div>
      
      {showBreakdown && (
        <div className="mt-3 pt-3 border-t border-green-200 space-y-1">
          <div className="flex justify-between text-sm text-green-600">
            <span>Service Total</span>
            <span>${(booking.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Platform Fee (30%)</span>
            <span>-${(booking.platformFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-green-800 pt-1">
            <span>You Receive</span>
            <span>${netEarnings.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      <p className="mt-2 text-xs text-green-600">
        Amount deposited to your bank account
      </p>
    </div>
  );
}

