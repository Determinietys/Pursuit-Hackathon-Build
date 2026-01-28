# SnowClear Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `http://localhost:3000` for development
   - `STRIPE_SECRET_KEY`: From your Stripe dashboard
   - `STRIPE_PUBLISHABLE_KEY`: From your Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET`: From Stripe webhook settings
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: (Optional) For map features

3. **Set Up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed Service Cities (Optional)**
   You can create a seed script to populate the `ServiceCity` table with the cities from `lib/constants/service-cities.ts`.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Database Setup

The application uses PostgreSQL. Make sure you have:
- PostgreSQL installed and running
- A database created (e.g., `snowclear`)
- Connection string in format: `postgresql://user:password@localhost:5432/snowclear`

For production, you may want to enable PostGIS extension for accurate geo queries:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Set up webhooks:
   - Endpoint URL: `https://yourdomain.com/api/payments/webhook`
   - Events to listen for:
     - `account.updated`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the webhook secret to `.env`

## Next Steps

1. **Seed Initial Data**: Create a script to seed service cities
2. **Set Up City APIs**: Configure API keys for cities with street status APIs
3. **Test Authentication**: Register a user and test login
4. **Test Provider Onboarding**: Create a provider account and test Stripe Connect flow
5. **Test Booking Flow**: Create a booking from customer to provider

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/lib` - Utilities, services, and configurations
- `/prisma` - Database schema
- `/types` - TypeScript type definitions

## Key Features Implemented

✅ User authentication (NextAuth.js)
✅ Provider onboarding with Stripe Connect
✅ Booking creation and management
✅ Payment processing with 30% platform fee
✅ Street status integration (framework ready)
✅ Provider and customer dashboards
✅ Earnings display (shows net after platform fee)

## Notes

- The map component is simplified. For production, integrate with react-map-gl and Mapbox.
- Street status sync requires city API credentials and may need custom adapters per city.
- Some API routes may need additional validation and error handling for production.

