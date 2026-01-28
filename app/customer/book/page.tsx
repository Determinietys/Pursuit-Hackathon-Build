'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Provider {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  baseHourlyRate: number;
  minimumCharge: number;
  bio: string | null;
}

export default function BookPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [selectedCity]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const url = selectedCity
        ? `/api/providers?cityId=${selectedCity}`
        : '/api/providers';
      const response = await fetch(url);
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Find a Snow Removal Provider</h1>

        <div className="mb-6">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by City
          </label>
          <select
            id="city"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="">All Cities</option>
            {/* Cities would be loaded from API */}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No providers found in your area</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle>
                    {provider.user.firstName} {provider.user.lastName}
                  </CardTitle>
                  <CardDescription>
                    {provider.bio || 'Professional snow removal service'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <span className="font-semibold">
                      {provider.averageRating.toFixed(1)} ⭐ ({provider.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jobs Completed</span>
                    <span className="font-semibold">{provider.completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Minimum Charge</span>
                    <span className="font-semibold">${Number(provider.minimumCharge).toFixed(2)}</span>
                  </div>
                  <Link href={`/customer/book/${provider.id}`}>
                    <Button className="w-full">Book Now</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

