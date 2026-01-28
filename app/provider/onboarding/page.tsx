'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/providers/onboard', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start onboarding');
        return;
      }

      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Provider Onboarding</CardTitle>
          <CardDescription>
            Complete your Stripe Connect setup to start receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">What you'll need:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Business information (or personal if individual)</li>
              <li>Bank account details for payouts</li>
              <li>Tax identification number (SSN or EIN)</li>
              <li>Government-issued ID</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> SnowClear takes a 30% platform fee on each transaction. 
              You'll receive 70% of the service total as your net earnings.
            </p>
          </div>

          <Button
            onClick={handleStartOnboarding}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Starting...' : 'Start Stripe Onboarding'}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            You'll be redirected to Stripe to complete the onboarding process
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

