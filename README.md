# SnowClear - Snow Cleanup Marketplace Platform

A two-sided marketplace platform connecting property owners who need snow removal services with independent snow cleanup providers. The platform operates in NYC's five boroughs and the top 20 snowiest US cities.

## Features

- **Two-sided Marketplace**: Connect customers with snow removal providers
- **Stripe Connect Integration**: Secure payments with automatic 30% platform fee
- **Real-time Street Status**: Integration with city street cleaning APIs
- **Provider Onboarding**: Complete Stripe Connect Express account setup
- **Booking Management**: Full booking lifecycle from request to completion
- **Reviews & Ratings**: Customer feedback system
- **Multi-city Support**: NYC boroughs and top 20 snowiest US cities

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js)
- **Payments**: Stripe Connect (Express accounts)
- **Maps**: Mapbox (react-map-gl)
- **Real-time**: Socket.io or Pusher (for future implementation)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account
- Mapbox account (for maps)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Pursuit-Hackathon-Build
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox access token
- Other API keys as needed

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
├── api/              # API routes
├── (auth)/           # Authentication pages
├── (customer)/       # Customer-facing pages
├── (provider)/       # Provider-facing pages
└── page.tsx          # Home page

/components
├── ui/               # shadcn/ui components
├── payments/         # Payment-related components
├── maps/             # Map components
└── bookings/         # Booking components

/lib
├── services/         # Business logic services
├── constants/        # Constants and configurations
└── utils.ts          # Utility functions

/prisma
└── schema.prisma     # Database schema
```

## Key Features

### Payment System
- 30% platform fee automatically calculated
- Providers see net earnings (70% of total)
- Stripe Connect Express accounts for providers
- Automatic transfers to provider accounts

### Street Status Integration
- Real-time integration with city APIs
- Visual map showing cleared vs. uncleared streets
- Support for NYC OpenData and other city APIs

### Booking Flow
1. Customer searches for providers
2. Customer creates booking request
3. Provider accepts booking
4. Provider starts and completes job
5. Payment automatically processed
6. Customer can leave review

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/providers/*` - Provider endpoints
- `/api/bookings/*` - Booking management
- `/api/payments/*` - Payment processing
- `/api/streets/*` - Street status data
- `/api/cities/*` - Service cities

## Database Schema

The database includes models for:
- Users (customers, providers, admins)
- Bookings (full lifecycle)
- Payments (Stripe integration)
- Reviews and ratings
- Street segments (city API data)
- Notifications
- Disputes

See `prisma/schema.prisma` for full schema.

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

1. Set up PostgreSQL database (with PostGIS extension for geo queries)
2. Configure environment variables
3. Run database migrations
4. Deploy to Vercel or your preferred hosting

## License

MIT

