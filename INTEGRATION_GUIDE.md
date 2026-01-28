# SnowClear Integration Guide - Adding to Another Repository

This guide explains how to integrate SnowClear into an existing Next.js application repository.

## Prerequisites

- Next.js 14+ application with App Router
- PostgreSQL database
- NextAuth.js (or compatible auth system)
- TypeScript
- Prisma ORM

## Step 1: Copy SnowClear Files

Copy the following directories and files to your target repository:

### Required Files to Copy

```bash
# From this repository, copy:

# 1. API Routes (isolated namespace)
app/api/snowclear/          → your-repo/app/api/snowclear/

# 2. Feature Flag System
lib/snowclear/              → your-repo/lib/snowclear/
components/snowclear/       → your-repo/components/snowclear/

# 3. Services (if you want to isolate them)
# OR keep using existing services in lib/services/
# The API routes reference: @/lib/services/booking.service
# You can either:
#   a) Copy the services to lib/snowclear/services/
#   b) Keep them in lib/services/ (they're already isolated by table names)

# 4. Constants
lib/constants/service-cities.ts → your-repo/lib/constants/service-cities.ts

# 5. Scripts
scripts/snowclear-verify.sh → your-repo/scripts/snowclear-verify.sh

# 6. Documentation
SNOWCLEAR_INTEGRATION.md    → your-repo/SNOWCLEAR_INTEGRATION.md
```

### Quick Copy Command

```bash
# From the SnowClear repository root:
cd /path/to/snowclear-repo

# To your target repository:
cp -r app/api/snowclear /path/to/your-repo/app/api/
cp -r lib/snowclear /path/to/your-repo/lib/
cp -r components/snowclear /path/to/your-repo/components/
cp lib/constants/service-cities.ts /path/to/your-repo/lib/constants/
cp scripts/snowclear-verify.sh /path/to/your-repo/scripts/
cp SNOWCLEAR_INTEGRATION.md /path/to/your-repo/
```

## Step 2: Install Dependencies

Add these dependencies to your `package.json`:

```bash
npm install stripe @stripe/stripe-js
npm install @prisma/client prisma
npm install bcryptjs @types/bcryptjs
npm install zod  # For validation (if not already installed)
```

If you don't have these already:
```bash
npm install next-auth@beta @auth/prisma-adapter
npm install react-map-gl mapbox-gl  # For maps (optional)
```

## Step 3: Database Schema Integration

### Option A: Add to Existing Prisma Schema (Recommended)

Add these models to your existing `prisma/schema.prisma`:

```prisma
// ============================================
// SNOWCLEAR MODELS - NEW TABLES ONLY
// Do NOT modify any existing models above
// ============================================

// Note: These reference your existing User table by ID only
// No Prisma relations that modify User model

model Booking {
  id                  String        @id @default(cuid())
  bookingNumber       String        @unique @default(cuid())
  customerId          String        // References User.id
  providerId          String
  // ... (copy full Booking model from prisma/schema.prisma)
  
  @@map("bookings")  // Or use @@map("snowclear_bookings") for isolation
}

model ProviderProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique  // References User.id
  // ... (copy full ProviderProfile model)
  
  @@map("provider_profiles")
}

// Copy all other SnowClear models:
// - CustomerProfile
// - ServiceCity
// - Address
// - StreetSegment
// - Review
// - Notification
// - Dispute
// - etc.
```

### Option B: Use Separate Schema File (Advanced)

Create `prisma/snowclear-schema.prisma` and merge during build.

### Run Migration

```bash
# Generate Prisma client
npx prisma generate

# Create migration (review before applying!)
npx prisma migrate dev --name add_snowclear_tables

# Or push to dev database
npx prisma db push
```

## Step 4: Update Service Imports

The SnowClear API routes reference services. You have two options:

### Option A: Use Existing Services (If Compatible)

If your existing services match the interface, update imports in API routes:

```typescript
// In app/api/snowclear/bookings/route.ts
// Change from:
import { BookingService } from '@/lib/services/booking.service';

// To either:
import { BookingService } from '@/lib/snowclear/services/booking.service';
// OR keep existing if compatible
```

### Option B: Copy Services to Isolated Directory

```bash
# Copy services to isolated location
cp -r lib/services/booking.service.ts lib/snowclear/services/
cp -r lib/services/payment.service.ts lib/snowclear/services/
cp -r lib/services/street-status.service.ts lib/snowclear/services/
cp -r lib/services/notification.service.ts lib/snowclear/services/

# Update imports in API routes
# Change: @/lib/services/booking.service
# To: @/lib/snowclear/services/booking.service
```

## Step 5: Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
# ===== SNOWCLEAR FEATURE FLAGS =====
# All default to false for safety
SNOWCLEAR_ENABLED=false
SNOWCLEAR_CUSTOMER_BOOKING=false
SNOWCLEAR_PROVIDER_ONBOARDING=false
SNOWCLEAR_STREET_STATUS=false
SNOWCLEAR_PAYMENTS=false
SNOWCLEAR_NOTIFICATIONS=false

# ===== SNOWCLEAR STRIPE =====
# Use existing Stripe keys OR separate keys
SNOWCLEAR_STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}  # Or separate key
SNOWCLEAR_STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}  # Or separate

# ===== SNOWCLEAR CITY APIS =====
SNOWCLEAR_NYC_OPENDATA_TOKEN=
SNOWCLEAR_CHICAGO_DATA_TOKEN=

# ===== SNOWCLEAR MAPS =====
SNOWCLEAR_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN}  # Or separate
```

## Step 6: Integrate with Existing Auth

### If Using NextAuth.js

The code already uses NextAuth. Ensure your `lib/auth.ts` exports `authOptions`:

```typescript
// lib/auth.ts (your existing file)
import { NextAuthOptions } from "next-auth";
// ... your existing config

export const authOptions: NextAuthOptions = {
  // ... your config
};

// Ensure this is exported for SnowClear routes
```

### If Using Different Auth

Update all API routes to use your auth system:

```typescript
// In app/api/snowclear/bookings/route.ts
// Replace:
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);

// With your auth:
import { getCurrentUser } from '@/lib/auth';  // Your auth function
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Step 7: Update TypeScript Paths

Ensure your `tsconfig.json` has the path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Step 8: Test the Integration

### 1. Verify Feature Flags Work

```bash
# Start dev server
npm run dev

# Test feature flag endpoint (should return enabled: false)
curl http://localhost:3000/api/snowclear/flags?flag=snowclear_enabled
# Expected: {"enabled":false,"flag":"snowclear_enabled"}

# Test protected route (should return 404 when disabled)
curl http://localhost:3000/api/snowclear/bookings
# Expected: {"error":"Not found"}
```

### 2. Enable and Test

```bash
# Set environment variable
export SNOWCLEAR_ENABLED=true

# Restart server
npm run dev

# Test again
curl http://localhost:3000/api/snowclear/flags?flag=snowclear_enabled
# Expected: {"enabled":true,"flag":"snowclear_enabled"}

curl http://localhost:3000/api/snowclear/bookings
# Expected: {"error":"Unauthorized"} (because no auth, but route is accessible)
```

### 3. Run Verification Script

```bash
chmod +x scripts/snowclear-verify.sh
./scripts/snowclear-verify.sh
```

## Step 9: Database Setup (Optional)

If you want to use the FeatureFlag table for database-driven flags:

```prisma
// Add to your schema.prisma
model FeatureFlag {
  id        String   @id @default(cuid())
  flagName  String
  userId    String   // 'global' for global flags
  enabled   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([flagName, userId])
  @@map("feature_flags")
}
```

Then run migration:
```bash
npx prisma migrate dev --name add_feature_flags
```

## Step 10: Frontend Integration (Optional)

If you want to add SnowClear pages to your frontend:

```typescript
// app/snowclear/page.tsx (or wherever you want)
'use client';

import { useFeatureFlag } from '@/components/snowclear/useFeatureFlag';
import { SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';

export default function SnowClearPage() {
  const { enabled, loading } = useFeatureFlag(SNOWCLEAR_FLAGS.ENABLED);

  if (loading) return <div>Loading...</div>;
  if (!enabled) return <div>Feature not available</div>;

  return <div>SnowClear Dashboard</div>;
}
```

## Step 11: Update Existing Routes (If Needed)

If you have existing routes that conflict, SnowClear routes are isolated under `/api/snowclear/` so there should be no conflicts.

However, if you have:
- `/api/bookings` - SnowClear uses `/api/snowclear/bookings` (no conflict)
- `/api/providers` - SnowClear uses `/api/snowclear/providers` (no conflict)

## Troubleshooting

### Issue: "Module not found" errors

**Solution**: Check that all files were copied and paths are correct. Verify `tsconfig.json` paths.

### Issue: "Prisma client not generated"

**Solution**: Run `npx prisma generate` after adding schema.

### Issue: "Auth not working"

**Solution**: Ensure your auth system is compatible or update auth calls in API routes.

### Issue: "Feature flags always false"

**Solution**: 
1. Check environment variables are set
2. Verify `.env` file is loaded
3. Restart dev server after changing env vars

### Issue: "Database errors"

**Solution**:
1. Run migrations: `npx prisma migrate dev`
2. Check database connection string
3. Verify all required tables exist

## Verification Checklist

- [ ] All files copied to correct locations
- [ ] Dependencies installed
- [ ] Database schema added and migrated
- [ ] Environment variables configured
- [ ] Auth system integrated
- [ ] Feature flags default to `false`
- [ ] Routes return 404 when disabled
- [ ] Routes work when enabled
- [ ] Verification script passes
- [ ] No conflicts with existing routes

## Rollback Plan

If something goes wrong:

1. **Disable via environment** (instant):
   ```bash
   SNOWCLEAR_ENABLED=false
   ```

2. **Remove routes** (if needed):
   ```bash
   rm -rf app/api/snowclear
   ```

3. **Remove database tables** (if needed):
   ```bash
   npx prisma migrate reset  # WARNING: This resets entire database
   # OR manually drop tables
   ```

## Next Steps

1. **Enable gradually**:
   - Start with `SNOWCLEAR_ENABLED=true` in development
   - Test thoroughly
   - Enable sub-features one by one
   - Roll out to production with feature flags

2. **Monitor**:
   - Check logs for `[SNOWCLEAR]` prefix
   - Monitor error rates
   - Track feature flag usage

3. **Iterate**:
   - Gather feedback
   - Adjust feature flags
   - Add more isolation if needed

## Support

For issues:
1. Check `SNOWCLEAR_INTEGRATION.md`
2. Review logs for `[SNOWCLEAR]` prefix
3. Run verification script
4. Check feature flag status

---

**Remember**: All SnowClear code is isolated and feature-flagged. It's safe to deploy with flags disabled and enable gradually.

