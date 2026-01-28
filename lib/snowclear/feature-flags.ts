/**
 * SnowClear Feature Flags
 * All new functionality MUST be wrapped in these flags
 * 
 * ISOLATION: This file is in /lib/snowclear/ to keep it isolated
 */

import { prisma } from '@/lib/prisma';

export const SNOWCLEAR_FLAGS = {
  // Master kill switch for entire feature
  ENABLED: 'snowclear_enabled',
  
  // Sub-feature flags for gradual rollout
  CUSTOMER_BOOKING: 'snowclear_customer_booking',
  PROVIDER_ONBOARDING: 'snowclear_provider_onboarding',
  STREET_STATUS_MAP: 'snowclear_street_status',
  PAYMENTS: 'snowclear_payments',
  NOTIFICATIONS: 'snowclear_notifications',
} as const;

// Environment-based defaults (override in database/config service)
export const FLAG_DEFAULTS: Record<string, boolean> = {
  [SNOWCLEAR_FLAGS.ENABLED]: process.env.SNOWCLEAR_ENABLED === 'true',
  [SNOWCLEAR_FLAGS.CUSTOMER_BOOKING]: process.env.SNOWCLEAR_CUSTOMER_BOOKING === 'true',
  [SNOWCLEAR_FLAGS.PROVIDER_ONBOARDING]: process.env.SNOWCLEAR_PROVIDER_ONBOARDING === 'true',
  [SNOWCLEAR_FLAGS.STREET_STATUS_MAP]: process.env.SNOWCLEAR_STREET_STATUS === 'true',
  [SNOWCLEAR_FLAGS.PAYMENTS]: process.env.SNOWCLEAR_PAYMENTS === 'true',
  [SNOWCLEAR_FLAGS.NOTIFICATIONS]: process.env.SNOWCLEAR_NOTIFICATIONS === 'true',
};

/**
 * Check if a feature flag is enabled
 * Checks: ENV → Database → Default
 */
export async function isFeatureEnabled(
  flag: string,
  userId?: string,
  context?: { city?: string; role?: string }
): Promise<boolean> {
  // 1. Check environment override (highest priority)
  const envKey = flag.toUpperCase().replace(/\./g, '_');
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === 'true';
  }

  // 2. Check database for user/context-specific override
  // This allows gradual rollout by user, city, etc.
  // Note: FeatureFlag model would need to be added to schema if not exists
  try {
    if (userId) {
      // Check if FeatureFlag model exists (safe check)
      const userFlag = await prisma.$queryRawUnsafe<Array<{ enabled: boolean }>>(
        `SELECT enabled FROM "FeatureFlag" WHERE "flagName" = $1 AND "userId" = $2 LIMIT 1`,
        flag,
        userId
      ).catch(() => []);
      
      if (userFlag.length > 0) {
        return userFlag[0].enabled;
      }
    }

    // 3. Check database for global flag setting
    const globalFlag = await prisma.$queryRawUnsafe<Array<{ enabled: boolean }>>(
      `SELECT enabled FROM "FeatureFlag" WHERE "flagName" = $1 AND "userId" = 'global' LIMIT 1`,
      flag
    ).catch(() => []);
    
    if (globalFlag.length > 0) {
      return globalFlag[0].enabled;
    }
  } catch (error) {
    // If FeatureFlag table doesn't exist, fall through to defaults
    console.debug('[SNOWCLEAR] FeatureFlag table not found, using defaults');
  }

  // 4. Return default
  return FLAG_DEFAULTS[flag] ?? false;
}

// Note: React hooks are in a separate client component file
// See: components/snowclear/useFeatureFlag.tsx

// HOC is in separate client component file
// See: components/snowclear/withFeatureFlag.tsx

