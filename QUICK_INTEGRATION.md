# Quick Integration Checklist

## 5-Minute Integration

### 1. Copy Files (2 min)

```bash
# From SnowClear repo to your repo:
cp -r app/api/snowclear your-repo/app/api/
cp -r lib/snowclear your-repo/lib/
cp -r components/snowclear your-repo/components/
cp lib/constants/service-cities.ts your-repo/lib/constants/
cp scripts/snowclear-verify.sh your-repo/scripts/
```

### 2. Install Dependencies (1 min)

```bash
cd your-repo
npm install stripe @stripe/stripe-js bcryptjs @types/bcryptjs zod
```

### 3. Add Database Models (1 min)

Copy SnowClear models from `prisma/schema.prisma` to your schema, then:

```bash
npx prisma generate
npx prisma db push  # or migrate
```

### 4. Add Environment Variables (30 sec)

Add to `.env`:
```bash
SNOWCLEAR_ENABLED=false
SNOWCLEAR_CUSTOMER_BOOKING=false
SNOWCLEAR_PROVIDER_ONBOARDING=false
SNOWCLEAR_PAYMENTS=false
SNOWCLEAR_STREET_STATUS=false
SNOWCLEAR_NOTIFICATIONS=false
```

### 5. Test (30 sec)

```bash
npm run dev
curl http://localhost:3000/api/snowclear/flags?flag=snowclear_enabled
# Should return: {"enabled":false}
```

## Done! ✅

All routes are disabled by default. Enable when ready:
```bash
SNOWCLEAR_ENABLED=true npm run dev
```

## File Structure After Integration

```
your-repo/
├── app/
│   └── api/
│       └── snowclear/          # ✅ NEW - Isolated
│           ├── flags/
│           ├── bookings/
│           ├── providers/
│           ├── payments/
│           ├── streets/
│           └── cities/
├── lib/
│   └── snowclear/              # ✅ NEW - Isolated
│       └── feature-flags.ts
├── components/
│   └── snowclear/              # ✅ NEW - Isolated
│       ├── useFeatureFlag.tsx
│       └── withFeatureFlag.tsx
└── prisma/
    └── schema.prisma           # ⚠️ MODIFIED - Added models
```

## What Gets Modified?

- ✅ **New files only** - All in `/snowclear/` directories
- ⚠️ **Schema.prisma** - Adds new models (doesn't modify existing)
- ✅ **No existing routes changed**
- ✅ **No existing components changed**
- ✅ **Safe to deploy** - All disabled by default

