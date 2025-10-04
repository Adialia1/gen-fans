# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GenFans is a SaaS platform for generating realistic images, videos, and face-swapping using AI models from providers like fal.ai and Higgsfield AI. Built on Next.js 15 (App Router) with Stripe payments, Drizzle ORM, PostgreSQL, and team-based subscriptions.

## Common Commands

### Development
```bash
pnpm dev                # Start development server (uses Turbopack)
pnpm build              # Build for production
pnpm start              # Start production server
```

### Database
```bash
pnpm db:setup           # Initial database and Stripe setup (interactive)
pnpm db:generate        # Generate Drizzle migrations from schema
pnpm db:migrate         # Run pending migrations
pnpm db:seed            # Seed database with initial data (includes reference models & pricing)
pnpm db:studio          # Open Drizzle Studio (visual DB explorer)
```

### Queue Worker (AI Jobs)
```bash
# In separate terminal (required for AI generation features)
node --loader ts-node/esm lib/queue/worker.ts
```
Processes model creation, refinement, and image generation jobs from BullMQ queue.
**Note**: Uses Upstash Redis (serverless) - no local Redis needed.

### Storage Cleanup (Cron Job)
```bash
# Run manually or setup as cron job
node lib/storage/cleanup.ts cleanup        # Delete 90-day expired images
node lib/storage/cleanup.ts mark-expired   # Mark jobs as expired (DB only)
node lib/storage/cleanup.ts stats          # Get storage statistics
```

### Stripe Setup
The `db:setup` script handles:
- Stripe CLI installation verification
- Local (Docker) or remote PostgreSQL setup
- Stripe webhook creation via CLI
- Environment variable configuration

After initial setup, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` in a separate terminal during development.

## Architecture

### Authentication & Sessions
- **Session Management**: JWT-based sessions using `jose` library (lib/auth/session.ts:25-59)
- **Middleware**: Route protection and session refresh on GET requests (middleware.ts:5-44)
- **Password Hashing**: bcryptjs with 10 salt rounds (lib/auth/session.ts:7)
- Protected routes start with `/dashboard`, unauthenticated users redirected to `/sign-in`

### Database & ORM
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema Location**: lib/db/schema.ts
- **Core Tables**:
  - `users`: User accounts with soft deletes (deletedAt)
  - `teams`: Team entities with Stripe subscription data
  - `teamMembers`: Many-to-many user-team relationships
  - `activityLogs`: Audit trail for user/team actions
  - `invitations`: Team invitation workflow

- **AI Generation Tables**:
  - `referenceModels`: Pre-built model catalog (50+ fashion/fitness/beauty models)
  - `customModels`: User-created AI models with versioning and refinement history
  - `jobs`: Queue job tracking (model creation, refinement, image generation)
  - `creditBalances`: Team credit allocation with reserved/available tracking
  - `creditTransactions`: Atomic credit operations (reservation, deduction, refund)
  - `creditPricingConfig`: Database-driven pricing formulas by operation type

- **Query Patterns**:
  - Always filter out soft-deleted users with `isNull(users.deletedAt)`
  - Use `getUser()` to retrieve current session user (lib/db/queries.ts:7-37)
  - Use `getTeamForUser()` for team data with nested members (lib/db/queries.ts:102-130)
  - Use `getCreditBalance(teamId)` for credit balance (lib/db/queries.ts:135-142)
  - Use `getActiveJobsCount(teamId)` for concurrency checks (lib/db/queries.ts:148-159)

### AI Generation System
- **Provider**: fal.ai via @fal-ai/serverless-client SDK
- **Client Wrapper**: lib/generation/fal-client.ts
- **Job Types**:
  - `model_creation`: Train custom model from reference + images (50-100 credits)
  - `model_refinement`: Improve model with additional prompting (30-60 credits)
  - `image_generation`: Generate images from custom model (5-20 credits)

- **Queue System**: BullMQ with Redis
  - Queue: lib/queue/queue.ts (priority-based, plan-specific concurrency)
  - Worker: lib/queue/worker.ts (routes jobs to processors)
  - Processors: lib/queue/processors/* (handle fal.ai calls, S3 upload, credit deduction)

- **Credit Management**:
  - Atomic transactions with PostgreSQL row-level locking (FOR UPDATE)
  - Flow: Reserve → Deduct (on success) | Refund (on failure)
  - Calculator: lib/credits/calculator.ts (dynamic cost based on complexity, resolution, quality)
  - Service: lib/credits/credit-service.ts (getBalance, replenish, stats)
  - Transactions: lib/credits/transactions.ts (reserveCredits, deductCredits, refundCredits)

- **Storage**: AWS S3 + CloudFront CDN
  - Client: lib/storage/s3-client.ts (upload, delete, presigned URLs)
  - Service: lib/storage/image-storage.ts (saveGeneratedImage, getImageUrl)
  - Cleanup: lib/storage/cleanup.ts (90-day expiration cron job)

### Payments (Stripe)
- **Integration**: lib/payments/stripe.ts
- **Checkout Flow**: Creates sessions with 14-day trial period (stripe.ts:14-48)
- **Customer Portal**: Auto-configured portal for subscription management (stripe.ts:50-116)
- **Webhook Handler**: app/api/stripe/webhook/route.ts handles subscription events
- **Credit Replenishment**: invoice.payment_succeeded triggers monthly credit reset
- **Subscription States**: active, trialing, canceled, unpaid stored in teams.subscriptionStatus

### Route Structure
```
app/
├── (dashboard)/        # Authenticated routes with header/nav
│   ├── dashboard/      # Main dashboard pages
│   │   ├── activity/   # Activity logs
│   │   ├── general/    # General settings
│   │   └── security/   # Security settings
│   ├── pricing/        # Pricing page (public but uses auth layout)
│   └── layout.tsx      # Shared header with user menu
├── (login)/            # Unauthenticated routes (sign-in, sign-up)
└── api/                # API routes
    ├── reference-models/  # GET catalog, GET /[id]
    ├── models/            # CRUD custom models, POST /[id]/refine
    ├── generate/          # POST queue job, GET /[jobId] status
    ├── jobs/              # GET list, GET /[id] details, DELETE /[id] cancel
    ├── credits/           # GET /balance, GET /history
    ├── webhooks/
    │   └── fal/           # POST fal.ai callback handler
    └── stripe/
        └── webhook/       # POST Stripe events (subscription, payment)
```

Route groups `(dashboard)` and `(login)` organize layouts without affecting URLs.

### Data Fetching Patterns
- **Server Components**: Use `getUser()` and `getTeamForUser()` directly
- **Client Components**: Use SWR for `/api/user` and `/api/team` endpoints
- **Server Actions**: Wrap with `withTeam()` middleware for team context (lib/auth/middleware.ts)

### Next.js Configuration
- **Experimental Features** (next.config.ts):
  - `ppr: true` - Partial Prerendering
  - `clientSegmentCache: true` - Client-side segment caching
  - `nodeMiddleware: true` - Node.js runtime middleware

## Environment Variables

Required in `.env` (not `.env.local` without config changes):
- `POSTGRES_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key (sk_test_* or sk_live_*)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (whsec_*)
- `BASE_URL` - Application base URL (http://localhost:3000 for dev)
- `AUTH_SECRET` - 64-char hex string for JWT signing

**AI Generation Services**:
- `FAL_KEY` - fal.ai API key from https://fal.ai/dashboard
- `FAL_WEBHOOK_SECRET` - Webhook signing secret for fal.ai callbacks
- `REDIS_URL` - Upstash Redis URL (rediss://default:***@***.upstash.io:6379)
  - Get from: https://console.upstash.com/redis
  - Supports TLS (rediss://) for secure serverless Redis

**AWS S3 Storage**:
- `AWS_ACCESS_KEY_ID` - AWS access key with S3 permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_S3_BUCKET` - S3 bucket name for image storage
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `CLOUDFRONT_DOMAIN` - CloudFront distribution domain (optional, for CDN)

## Key Conventions

### Type Exports
All database types exported from schema.ts:
```typescript
type User = typeof users.$inferSelect;      // Select operations
type NewUser = typeof users.$inferInsert;   // Insert operations
```

### Server Actions
- Mark with `'use server'` directive
- Use `withTeam()` wrapper for team-scoped actions (lib/payments/actions.ts:7-15)
- Handle redirects via `redirect()` from `next/navigation`

### Activity Logging
Use `ActivityType` enum (schema.ts:131-142) for standardized action names in activity logs.

### Soft Deletes
Users are soft-deleted (deletedAt timestamp) rather than hard-deleted. Always filter with `isNull(users.deletedAt)` in queries.
