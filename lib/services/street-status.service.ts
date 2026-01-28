import { prisma } from '@/lib/prisma';
import { PlowStatus } from '@prisma/client';

interface NYCPlowData {
  segment_id: string;
  street_name: string;
  from_street: string;
  to_street: string;
  borough: string;
  plow_timestamp: string;
  status: string;
  depth_inches?: number;
}

interface GenericPlowData {
  id: string;
  street: string;
  status: string;
  lastUpdated: string;
  geometry?: any;
}

export class StreetStatusService {
  /**
   * Sync street data from NYC OpenData
   */
  static async syncNYCStreetStatus(cityId: string): Promise<number> {
    const city = await prisma.serviceCity.findUnique({
      where: { id: cityId },
    });

    if (!city?.streetApiUrl) {
      throw new Error('NYC API not configured for this city');
    }

    // Fetch from NYC PlowNYC API
    const response = await fetch(
      `${city.streetApiUrl}?$limit=50000&$order=plow_timestamp DESC`,
      {
        headers: {
          'X-App-Token': process.env.NYC_OPENDATA_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NYC API error: ${response.status}`);
    }

    const data: NYCPlowData[] = await response.json();

    // Process and upsert street segments
    let updatedCount = 0;
    
    for (const segment of data) {
      const plowStatus = this.mapNYCStatus(segment.status);
      
      await prisma.streetSegment.upsert({
        where: {
          cityId_externalId: {
            cityId,
            externalId: segment.segment_id,
          },
        },
        update: {
          plowStatus,
          lastPlowedAt: segment.plow_timestamp 
            ? new Date(segment.plow_timestamp) 
            : null,
          snowDepth: segment.depth_inches,
          lastUpdated: new Date(),
        },
        create: {
          cityId,
          externalId: segment.segment_id,
          streetName: segment.street_name,
          fromStreet: segment.from_street,
          toStreet: segment.to_street,
          borough: segment.borough,
          plowStatus,
          lastPlowedAt: segment.plow_timestamp 
            ? new Date(segment.plow_timestamp) 
            : null,
          snowDepth: segment.depth_inches,
          geometry: {}, // Would be populated from separate geometry endpoint
          lastUpdated: new Date(),
        },
      });
      
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Generic sync for other cities
   */
  static async syncCityStreetStatus(cityId: string): Promise<number> {
    const city = await prisma.serviceCity.findUnique({
      where: { id: cityId },
    });

    if (!city?.streetApiEnabled || !city.streetApiUrl) {
      throw new Error('Street API not configured for this city');
    }

    const response = await fetch(city.streetApiUrl, {
      headers: city.streetApiKey 
        ? { 'Authorization': `Bearer ${city.streetApiKey}` }
        : {},
    });

    if (!response.ok) {
      throw new Error(`City API error: ${response.status}`);
    }

    const data: GenericPlowData[] = await response.json();
    let updatedCount = 0;

    for (const segment of data) {
      await prisma.streetSegment.upsert({
        where: {
          cityId_externalId: {
            cityId,
            externalId: segment.id,
          },
        },
        update: {
          plowStatus: this.mapGenericStatus(segment.status),
          lastUpdated: new Date(segment.lastUpdated),
          geometry: segment.geometry || {},
        },
        create: {
          cityId,
          externalId: segment.id,
          streetName: segment.street,
          plowStatus: this.mapGenericStatus(segment.status),
          lastUpdated: new Date(segment.lastUpdated),
          geometry: segment.geometry || {},
        },
      });
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Get street status near a location
   * Note: This requires PostGIS extension for proper geo queries
   */
  static async getNearbyStreetStatus(
    latitude: number,
    longitude: number,
    radiusMiles: number = 0.5,
    cityId?: string
  ) {
    // For now, return a simple query
    // In production, you'd use PostGIS ST_DWithin for proper geo queries
    const where: any = {};
    if (cityId) {
      where.cityId = cityId;
    }

    const segments = await prisma.streetSegment.findMany({
      where,
      take: 100,
      orderBy: { lastUpdated: 'desc' },
    });

    // Filter by approximate distance (simple calculation)
    // In production, use PostGIS for accurate geo queries
    return segments.filter(segment => {
      // Simple distance calculation (not accurate for long distances)
      // This is a placeholder - use PostGIS in production
      return true; // Return all for now
    });
  }

  /**
   * Get aggregate status for a neighborhood/zip
   */
  static async getAreaStatus(
    cityId: string,
    zipCode?: string,
    neighborhood?: string
  ): Promise<{
    total: number;
    cleared: number;
    partiallyCleared: number;
    notCleared: number;
    percentCleared: number;
  }> {
    const where: any = { cityId };
    if (zipCode) where.zipCode = zipCode;
    if (neighborhood) where.neighborhood = neighborhood;

    const counts = await prisma.streetSegment.groupBy({
      by: ['plowStatus'],
      where,
      _count: true,
    });

    const total = counts.reduce((sum, c) => sum + c._count, 0);
    const cleared = counts.find(c => c.plowStatus === 'CLEARED')?._count || 0;
    const partial = counts.find(c => c.plowStatus === 'PARTIALLY_CLEARED')?._count || 0;
    const notCleared = counts.find(c => c.plowStatus === 'NOT_CLEARED')?._count || 0;

    return {
      total,
      cleared,
      partiallyCleared: partial,
      notCleared,
      percentCleared: total > 0 ? Math.round((cleared / total) * 100) : 0,
    };
  }

  /**
   * Map NYC-specific status to our enum
   */
  private static mapNYCStatus(status: string): PlowStatus {
    const statusMap: Record<string, PlowStatus> = {
      'PLOWED': PlowStatus.CLEARED,
      'PARTIALLY_PLOWED': PlowStatus.PARTIALLY_CLEARED,
      'NOT_PLOWED': PlowStatus.NOT_CLEARED,
      'IN_PROGRESS': PlowStatus.IN_PROGRESS,
      'SCHEDULED': PlowStatus.SCHEDULED,
    };
    return statusMap[status.toUpperCase()] || PlowStatus.UNKNOWN;
  }

  /**
   * Map generic status strings
   */
  private static mapGenericStatus(status: string): PlowStatus {
    const normalized = status.toLowerCase();
    if (normalized.includes('clear') || normalized.includes('plow')) {
      return PlowStatus.CLEARED;
    }
    if (normalized.includes('partial')) {
      return PlowStatus.PARTIALLY_CLEARED;
    }
    if (normalized.includes('progress')) {
      return PlowStatus.IN_PROGRESS;
    }
    if (normalized.includes('schedule')) {
      return PlowStatus.SCHEDULED;
    }
    return PlowStatus.NOT_CLEARED;
  }
}

