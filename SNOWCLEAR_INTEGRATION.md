# SnowClear Integration Guide

## Overview

SnowClear has been integrated into this application following strict isolation principles. All SnowClear functionality is:

- **Isolated** in `/snowclear/` directories
- **Feature-flagged** for safe rollout
- **Namespaced** under `/api/snowclear/` for API routes
- **Prefixed** with `snowclear_` for database tables (when migrated)

## Feature Flags

All SnowClear features are controlled by feature flags. Defaults are `false` for safety.

### Environment Variables

```bash
# Master switch
SNOWCLEAR_ENABLED=false

# Sub-features
SNOWCLEAR_CUSTOMER_BOOKING=false
SNOWCLEAR_PROVIDER_ONBOARDING=false
SNOWCLEAR_STREET_STATUS=false
SNOWCLEAR_PAYMENTS=false
SNOWCLEAR_NOTIFICATIONS=false
```

### Enabling Features

1. **Environment-based** (highest priority):
   ```bash
   SNOWCLEAR_ENABLED=true
   SNOWCLEAR_CUSTOMER_BOOKING=true
   ```

2. **Database-based** (for gradual rollout):
   ```sql
   INSERT INTO "FeatureFlag" ("flagName", "userId", "enabled")
   VALUES ('snowclear_enabled', 'global', true);
   ```

3. **User-specific** (for beta testing):
   ```sql
   INSERT INTO "FeatureFlag" ("flagName", "userId", "enabled")
   VALUES ('snowclear_enabled', 'user-id-here', true);
   ```

## API Routes

All SnowClear API routes are under `/api/snowclear/`:

- `GET /api/snowclear/flags` - Check feature flag status
- `GET /api/snowclear/bookings` - List bookings
- `POST /api/snowclear/bookings` - Create booking
- `GET /api/snowclear/providers` - Search providers
- `POST /api/snowclear/providers/onboard` - Provider onboarding
- `POST /api/snowclear/payments/create-intent` - Create payment
- `GET /api/snowclear/streets/status` - Street status
- `GET /api/snowclear/cities` - List service cities
- `POST /api/snowclear/webhooks/stripe` - Stripe webhooks

## Directory Structure

```
/app/api/snowclear/          # Isolated API routes
/lib/snowclear/              # Isolated services and utilities
/components/snowclear/        # Isolated components (when created)
/tests/snowclear/            # Isolated tests
```

## Safety Verification

Run the verification script before every commit:

```bash
./scripts/snowclear-verify.sh
```

This checks:
- ✅ No existing files modified
- ✅ All routes properly namespaced
- ✅ Feature flags in place
- ✅ Database tables properly prefixed
- ✅ Tests pass

## Rollback Procedure

To instantly disable SnowClear (no deployment needed):

```bash
# Set in environment
SNOWCLEAR_ENABLED=false

# Or in database
UPDATE "FeatureFlag" SET "enabled" = false WHERE "flagName" = 'snowclear_enabled';
```

All SnowClear features will immediately return 404 responses.

## Migration Strategy

### Phase 1: Dark Launch
- Deploy code with all flags `false`
- Internal testing only
- Monitor for errors

### Phase 2: Internal Beta
- Enable for specific user IDs via database
- Gather feedback

### Phase 3: Limited Rollout
- Enable for one city
- Monitor metrics

### Phase 4: Full Rollout
- Enable globally via environment variable
- Monitor closely

## Database Migration

When ready to migrate database tables to `snowclear_` prefix:

1. Create migration script in `scripts/snowclear-migrate.ts`
2. Run in transaction (rollback on error)
3. Verify all tables prefixed
4. Update Prisma schema with `@@map("snowclear_*")`

**Note**: Current implementation uses existing tables. Migration to prefixed tables is optional but recommended for full isolation.

## Monitoring

All SnowClear operations are prefixed with `[SNOWCLEAR]` in logs for easy filtering:

```bash
# Filter SnowClear logs
grep "[SNOWCLEAR]" logs/app.log
```

## Support

For issues or questions about SnowClear integration:
- Check feature flags first
- Verify routes are under `/api/snowclear/`
- Review logs for `[SNOWCLEAR]` prefix
- Run verification script

