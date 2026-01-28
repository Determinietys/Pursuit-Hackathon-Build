'use client';

import { useState, useEffect } from 'react';
import { StreetStatusMap } from '@/components/maps/StreetStatusMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MapPage() {
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([-74.006, 40.7128]); // Default to NYC

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      setCities(data);
      if (data.length > 0 && !selectedCity) {
        setSelectedCity(data[0].id);
        setCenter([data[0].longitude, data[0].latitude]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setCenter([city.longitude, city.latitude]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Street Status Map</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select City</CardTitle>
            <CardDescription>View real-time street clearing status</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.stateCode}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedCity && (
          <StreetStatusMap
            cityId={selectedCity}
            center={center}
            onStreetClick={(street) => {
              console.log('Street clicked:', street);
            }}
          />
        )}
      </div>
    </div>
  );
}

