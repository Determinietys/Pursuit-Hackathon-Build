'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS = {
  CLEARED: '#22c55e',           // green
  PARTIALLY_CLEARED: '#eab308', // yellow
  NOT_CLEARED: '#ef4444',       // red
  IN_PROGRESS: '#3b82f6',       // blue
  SCHEDULED: '#8b5cf6',         // purple
  UNKNOWN: '#9ca3af',           // gray
};

interface StreetSegment {
  id: string;
  streetName: string;
  plowStatus: string;
  lastUpdated: string | null;
  lastPlowedAt: string | null;
}

interface StreetStatusMapProps {
  cityId: string;
  center: [number, number];
  onStreetClick?: (street: StreetSegment) => void;
}

export function StreetStatusMap({ cityId, center, onStreetClick }: StreetStatusMapProps) {
  const [streets, setStreets] = useState<StreetSegment[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<StreetSegment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreets() {
      try {
        const res = await fetch(`/api/streets/status?cityId=${cityId}`);
        const data = await res.json();
        setStreets(data);
      } catch (error) {
        console.error('Error fetching streets:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStreets();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStreets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cityId]);

  // Simplified map view - in production, use react-map-gl with Mapbox
  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-gray-100 border">
      {loading ? (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="p-4">
            <h3 className="font-semibold mb-2">Street Status Map</h3>
            <p className="text-sm text-gray-600 mb-4">
              {streets.length} streets loaded for this area
            </p>
            
            {/* Street list view (simplified - in production, show on map) */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {streets.slice(0, 20).map((street) => (
                <div
                  key={street.id}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedStreet(street);
                    onStreetClick?.(street);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: STATUS_COLORS[street.plowStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.UNKNOWN,
                      }}
                    />
                    <span className="font-medium">{street.streetName}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {street.plowStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Street Status</h4>
            <div className="space-y-1">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span>{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedStreet && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold mb-2">{selectedStreet.streetName}</h3>
              <p className="text-sm text-gray-600 mb-1">
                Status: {selectedStreet.plowStatus.replace('_', ' ')}
              </p>
              {selectedStreet.lastPlowedAt && (
                <p className="text-xs text-gray-500">
                  Last plowed: {new Date(selectedStreet.lastPlowedAt).toLocaleString()}
                </p>
              )}
              <button
                onClick={() => setSelectedStreet(null)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

