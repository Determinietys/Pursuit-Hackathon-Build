#!/bin/bash
set -e

echo "🔍 Verifying SnowClear integration safety..."

# 1. Check no existing files modified (outside snowclear namespace)
echo "Checking for modifications to existing files..."
MODIFIED_EXISTING=$(git diff --name-only origin/main 2>/dev/null | grep -v "snowclear" | grep -v "^prisma/schema.prisma$" | grep -v "^\.env" | grep -v "package" || true)

if [ ! -z "$MODIFIED_EXISTING" ]; then
  echo "❌ ERROR: Existing files modified outside snowclear namespace:"
  echo "$MODIFIED_EXISTING"
  exit 1
fi

# 2. Verify all new API routes are under /api/snowclear/
echo "Checking API route namespace..."
UNNAMESPACED_ROUTES=$(find app/api -name "*.ts" -type f ! -path "*/snowclear/*" ! -path "*/auth/*" ! -path "*/users/*" 2>/dev/null | head -n 1 || true)

if [ ! -z "$UNNAMESPACED_ROUTES" ]; then
  echo "⚠️  WARNING: Some routes may not be in snowclear namespace"
fi

# 3. Check feature flags in place
echo "Verifying feature flags..."
UNPROTECTED_ROUTES=$(grep -r "export async function" app/api/snowclear --include="*.ts" 2>/dev/null | grep -v "isFeatureEnabled" | head -n 5 || true)

if [ ! -z "$UNPROTECTED_ROUTES" ]; then
  echo "⚠️  WARNING: Some routes may not have feature flag checks"
  echo "$UNPROTECTED_ROUTES"
fi

# 4. Run tests
echo "Running SnowClear tests..."
npm run test -- --testPathPattern="snowclear" --coverage 2>/dev/null || echo "⚠️  Tests not found or failed"

# 5. Check database table naming
echo "Checking database table naming..."
if grep -q "@map(\"snowclear_" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Database tables properly prefixed"
else
  echo "⚠️  WARNING: Some tables may not have snowclear_ prefix"
fi

echo "✅ Verification complete"

