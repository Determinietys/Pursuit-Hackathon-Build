# SnowClear Architecture Document

## System Overview

### What the System Does

SnowClear is a two-sided marketplace platform connecting property owners who need snow removal services with independent snow cleanup providers. The platform operates in NYC's five boroughs and the top 20 snowiest US cities, featuring real-time integration with city street cleaning APIs to show cleared vs. uncleared streets.

### Business Purpose

The platform enables:
- **Customers**: Property owners, businesses, and residents to find and book snow removal services
- **Providers**: Independent contractors to offer their services and receive payments
- **Platform**: Takes a 30% fee on each transaction, with providers seeing net earnings (70% of total)

### High-Level Operation

1. **Customer Flow**: Search providers → Create booking → Payment processed → Service completed → Review
2. **Provider Flow**: Onboard with Stripe Connect → Receive booking requests → Accept → Complete job → Receive payment (70% net)
3. **Platform Flow**: Match customers with providers → Process payments → Take 30% platform fee → Handle disputes

---

## Core Components & Responsibilities

### 1. Frontend (Next.js App Router)

**Location**: `/app`, `/components`

**Responsibilities**:
- User interface rendering
- Client-side routing
- Form handling and validation
- Real-time updates via API calls

**Key Modules**:
- `app/(auth)/` - Authentication pages (login, register, forgot-password)
- `app/(customer)/` - Customer-facing pages (dashboard, booking, addresses)
- `app/(provider)/` - Provider-facing pages (dashboard, onboarding, jobs, earnings)
- `app/settings/` - Comprehensive settings page
- `components/ui/` - Reusable UI components (shadcn/ui)
- `components/payments/` - Payment-related components (EarningsDisplay)
- `components/maps/` - Map components (StreetStatusMap)

**Interactions**:
- Calls API routes for data operations
- Uses NextAuth for session management
- Integrates with Stripe for payment UI

### 2. API Layer (Next.js API Routes)

**Location**: `/app/api`

**Responsibilities**:
- Handle HTTP requests
- Authentication and authorization
- Business logic orchestration
- Data validation

**Key Endpoints**:
- `/api/auth/*` - Authentication (register, login, password reset, sessions)
- `/api/users/*` - User management (profile, data export, account deletion)
- `/api/providers/*` - Provider operations (search, profile, onboarding)
- `/api/bookings/*` - Booking lifecycle (create, accept, complete, cancel)
- `/api/payments/*` - Payment processing (intents, webhooks)
- `/api/streets/*` - Street status data
- `/api/cities/*` - Service cities

**Interactions**:
- Calls service layer for business logic
- Validates requests
- Returns standardized responses

### 3. Service Layer

**Location**: `/lib/services`

**Responsibilities**:
- Core business logic
- External API integrations
- Data transformations

**Key Services**:

#### PaymentService (`lib/services/payment.service.ts`)
- Calculates pricing with 30% platform fee
- Creates Stripe Connect accounts
- Processes payment intents
- Handles refunds
- Manages provider payouts

#### BookingService (`lib/services/booking.service.ts`)
- Creates bookings with pricing calculation
- Manages booking status transitions
- Handles job completion and payment capture
- Formats provider earnings display

#### StreetStatusService (`lib/services/street-status.service.ts`)
- Syncs street data from city APIs (NYC OpenData, etc.)
- Maps city-specific status to platform enums
- Provides aggregate status by area
- Handles geo queries (requires PostGIS in production)

#### NotificationService (`lib/services/notification.service.ts`)
- Creates and manages user notifications
- Tracks read/unread status
- Supports multiple notification types

**Interactions**:
- Uses Prisma for database operations
- Calls external APIs (Stripe, city APIs)
- Returns structured data to API layer

### 4. Data Layer (Prisma ORM)

**Location**: `/prisma/schema.prisma`

**Responsibilities**:
- Database schema definition
- Type-safe database access
- Migration management

**Key Models**:
- `User` - Core user accounts with roles (CUSTOMER, PROVIDER, BOTH, ADMIN)
- `CustomerProfile` - Customer-specific data and Stripe customer ID
- `ProviderProfile` - Provider data, Stripe Connect account, ratings, pricing
- `Booking` - Full booking lifecycle with pricing breakdown
- `Address` - User addresses with property details
- `StreetSegment` - Street status data from city APIs
- `Review` - Customer reviews and ratings
- `Notification` - User notifications
- `Dispute` - Dispute resolution tracking

**Interactions**:
- Used by service layer for all database operations
- Provides type safety through generated Prisma Client

### 5. Authentication (NextAuth.js)

**Location**: `/lib/auth.ts`, `/app/api/auth/[...nextauth]/route.ts`

**Responsibilities**:
- User authentication
- Session management
- Role-based access control

**Features**:
- Email/password authentication
- JWT-based sessions
- Role assignment (CUSTOMER, PROVIDER, BOTH, ADMIN)
- Session management (view/revoke active sessions)

**Interactions**:
- Integrates with Prisma adapter
- Protects API routes via `getServerSession`
- Provides session data to frontend

### 6. Configuration & Constants

**Location**: `/lib/constants`

**Responsibilities**:
- Service city configurations
- API endpoint definitions
- Business rules and constants

**Key Files**:
- `service-cities.ts` - City configurations with API settings

---

## Data Flow & Control Flow

### Request Lifecycle: Customer Creates Booking

```
1. Frontend: User fills booking form
   ↓
2. API Route: POST /api/bookings
   - Validates session (getServerSession)
   - Validates request body
   ↓
3. BookingService.createBooking()
   - Fetches provider and pricing data
   - Calculates pricing (base + additional charges)
   - Applies emergency surcharge if needed
   - Calls PaymentService.calculatePricing()
   - Creates booking record in database
   - Sends notification to provider
   ↓
4. Database: Prisma creates Booking record
   - Stores pricing breakdown (all in cents)
   - Sets status to PENDING
   ↓
5. NotificationService.send()
   - Creates notification for provider
   ↓
6. API Route: Returns booking data
   ↓
7. Frontend: Displays confirmation
```

### Payment Processing Flow

```
1. Provider completes job
   ↓
2. API Route: POST /api/bookings/[id]/complete
   ↓
3. BookingService.completeJob()
   - Validates provider authorization
   - Captures payment via PaymentService
   ↓
4. PaymentService.capturePayment()
   - Calls Stripe API to capture payment intent
   - Automatic transfer to provider (70%)
   - Platform keeps 30%
   ↓
5. Stripe Webhook: POST /api/payments/webhook
   - Updates booking payment status
   - Handles account updates
   ↓
6. NotificationService: Sends payment confirmation
```

### Street Status Sync Flow

```
1. Cron Job (scheduled task)
   ↓
2. StreetStatusService.syncNYCStreetStatus()
   - Fetches from NYC OpenData API
   - Maps status to platform enums
   ↓
3. Database: Upserts StreetSegment records
   ↓
4. Frontend: Fetches via GET /api/streets/status
   - Displays on map
   - Updates every 5 minutes
```

---

## Infrastructure & Runtime Environment

### Runtime Assumptions

- **Local Development**: Node.js 18+, PostgreSQL database
- **Production**: Vercel (frontend), Railway/Render (backend services)
- **Database**: PostgreSQL with PostGIS extension (for geo queries)
- **Containerization**: Not currently containerized (can be added)

### Storage Systems

- **PostgreSQL**: Primary database (via Prisma)
- **File Storage**: Image URLs stored as strings (before/after photos)
- **Session Storage**: Database-backed (Prisma adapter)

### External Services

- **Stripe**: Payment processing and Connect accounts
- **City APIs**: NYC OpenData, various city street status APIs
- **Mapbox**: Map rendering (optional, currently simplified)
- **Email Service**: Not yet implemented (Resend API key in env)

### Queues & Background Jobs

- **Street Status Sync**: Should run as cron job (every 15 minutes during snow events)
- **Email Sending**: Should use queue for reliability
- **Payment Webhooks**: Handled synchronously (could be queued)

---

## Key Design Decisions

### 1. Pricing Storage in Cents

**Decision**: All monetary values stored as integers (cents) in database

**Rationale**: 
- Avoids floating-point precision issues
- Consistent with Stripe API (amounts in cents)
- Simplifies calculations

**Trade-offs**: 
- Requires conversion for display (cents → dollars)
- Slightly more complex for developers

### 2. 30% Platform Fee Architecture

**Decision**: Platform fee calculated and stored separately, providers see net earnings

**Rationale**:
- Transparent fee structure
- Providers see what they'll actually receive
- Easy to audit and adjust

**Implementation**:
- `PaymentService.calculatePricing()` centralizes calculation
- `EarningsDisplay` component shows net to providers
- All pricing breakdowns include platform fee

### 3. Next.js App Router

**Decision**: Use Next.js 14+ App Router instead of Pages Router

**Rationale**:
- Modern React patterns (Server Components)
- Better performance
- Improved developer experience
- Built-in API routes

### 4. Prisma ORM

**Decision**: Use Prisma instead of raw SQL or other ORMs

**Rationale**:
- Type safety
- Excellent developer experience
- Good migration system
- Works well with TypeScript

### 5. NextAuth.js for Authentication

**Decision**: Use NextAuth.js instead of custom auth

**Rationale**:
- Battle-tested
- Handles sessions securely
- Easy to extend
- Good TypeScript support

### 6. Stripe Connect Express

**Decision**: Use Express accounts (not Standard or Custom)

**Rationale**:
- Faster onboarding for providers
- Platform handles compliance
- Good UX for independent contractors
- Automatic payouts

---

## Scalability & Reliability Considerations

### Current Scaling Model

- **Stateless API**: Can horizontally scale
- **Database**: Single PostgreSQL instance (bottleneck)
- **File Storage**: URLs only (no file server needed yet)

### Bottlenecks & Risk Areas

1. **Database**: 
   - Single point of failure
   - No read replicas
   - Geo queries require PostGIS (not yet configured)

2. **Street Status Sync**:
   - Runs synchronously (could block)
   - No retry mechanism
   - No rate limiting for city APIs

3. **Payment Processing**:
   - Webhook handling is synchronous
   - No idempotency keys for retries
   - No queue for failed payments

4. **Image Uploads**:
   - Currently just URLs (no actual upload)
   - Need CDN/storage solution for production

### Reliability Improvements Needed

- Database replication and backups
- Queue system for background jobs
- Retry logic for external API calls
- Idempotency for payment operations
- Monitoring and alerting

---

## Security Model

### Authentication & Authorization

- **NextAuth.js**: Handles authentication securely
- **Session Management**: Database-backed, JWT tokens
- **Role-Based Access**: User roles enforced in API routes
- **Password Security**: bcrypt hashing (10 rounds)

### Secrets Handling

- **Environment Variables**: All secrets in `.env` (not committed)
- **Stripe Keys**: Server-side only
- **API Keys**: Stored in environment variables

### Boundaries of Trust

- **API Routes**: Validate all inputs
- **Service Layer**: Business logic validation
- **Database**: Prisma provides SQL injection protection
- **External APIs**: Validate responses, handle failures

### Data Protection

- **Password Hashing**: bcrypt with salt
- **Sensitive Data**: Not logged
- **GDPR Compliance**: Data export endpoint provided
- **Account Deletion**: Soft delete (marks as DEACTIVATED)

### Security Gaps

- No rate limiting on API routes
- No CSRF protection explicitly configured
- No input sanitization library
- No security headers configured
- Password reset tokens not yet implemented (stub only)

---

## Observability & Operations

### Logging

- **Console Logging**: Basic error logging in catch blocks
- **No Structured Logging**: Should implement (e.g., Winston, Pino)
- **No Log Aggregation**: Should add (e.g., Datadog, LogRocket)

### Metrics

- **No Metrics Collection**: Should add (e.g., Prometheus, StatsD)
- **Key Metrics Needed**:
  - API response times
  - Error rates
  - Booking completion rate
  - Payment success rate
  - Provider response time

### Monitoring

- **No Monitoring**: Should add (e.g., Sentry for errors, Uptime monitoring)
- **Health Checks**: No health check endpoint

### Debugging

- **Development**: Console logs
- **Production**: No debugging tools configured

---

## Future Improvement Opportunities

### Technical Debt

1. **Street Status Map**: Currently simplified, needs Mapbox integration
2. **Image Uploads**: Need actual file upload (currently URLs only)
3. **Email Service**: Not implemented (password reset, notifications)
4. **Password Reset**: Token storage not implemented
5. **Geo Queries**: PostGIS not configured, using simple distance calc
6. **Error Handling**: Inconsistent across routes
7. **Validation**: No schema validation library (should use Zod)
8. **Rate Limiting**: Not implemented
9. **Caching**: No caching layer
10. **Testing**: Limited test coverage

### Clear Next Steps

1. **Immediate**:
   - Add Zod for request validation
   - Implement password reset tokens
   - Add health check endpoint
   - Set up error tracking (Sentry)

2. **Short-term**:
   - Integrate Mapbox for maps
   - Implement file upload (S3/Cloudinary)
   - Add email service (Resend)
   - Set up PostGIS for geo queries
   - Add rate limiting

3. **Medium-term**:
   - Implement queue system (Bull/BullMQ)
   - Add monitoring and metrics
   - Database replication
   - Caching layer (Redis)
   - Comprehensive test coverage

4. **Long-term**:
   - Microservices architecture (if needed)
   - Real-time updates (WebSockets)
   - Mobile app
   - Advanced analytics

---

## Unknowns & Assumptions

### Unknowns

- Exact city API formats (some may differ from documented)
- Production database size and performance requirements
- Expected traffic volume
- Mobile app requirements (if any)

### Assumptions

- PostgreSQL will handle initial load
- Stripe Connect accounts will be approved quickly
- City APIs will be reliable during snow events
- Users will primarily use web interface (not mobile)

---

## Diagrams

### System Architecture (High-Level)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js App    │
│  (Frontend +    │
│   API Routes)   │
└──────┬──────────┘
       │
       ├──► Prisma ──► PostgreSQL
       │
       ├──► Stripe API
       │
       └──► City APIs (NYC, etc.)
```

### Booking Flow

```
Customer          API Route        BookingService      PaymentService      Database
   │                  │                  │                  │                │
   │──Create───────►  │                  │                  │                │
   │                  │──createBooking─►│                  │                │
   │                  │                  │──calculate─────►│                │
   │                  │                  │                  │                │
   │                  │                  │                  │                │
   │                  │                  │──save────────────┼──────────────►│
   │                  │◄─────────────────┼──────────────────┼────────────────┤
   │◄─Response───────│                  │                  │                │
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

