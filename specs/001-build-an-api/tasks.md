# Tasks: AI Image Generation with Credit Management

**Input**: Design documents from `/specs/001-build-an-api/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓
**Branch**: `001-build-an-api`

## Execution Summary

This task list implements a complete AI image generation system with:
- 6 new database tables (reference_models, custom_models, jobs, credit_balances, credit_transactions, credit_pricing_config)
- 23 REST API endpoints across 7 resource types
- 3 job processors (model creation, model refinement, image generation)
- BullMQ queue integration with Redis
- fal.ai API integration for AI generation
- S3 storage with 90-day lifecycle policy
- Atomic credit transaction system

**Total Tasks**: 52
**Estimated Time**: 3-4 weeks
**Parallel Opportunities**: 18 tasks marked [P]

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root

---

## Phase 3.1: Setup & Dependencies

- [x] **T001** Install new npm dependencies: `@fal-ai/serverless-client`, `bullmq`, `ioredis`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- [x] **T002** [P] Create environment variables template in `.env.example`: `FAL_KEY`, `REDIS_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`, `CLOUDFRONT_DOMAIN`
- [x] **T003** [P] Configure TypeScript paths for new lib directories in `tsconfig.json` (generation/*, queue/*, credits/*, storage/*)

---

## Phase 3.2: Database Schema & Migrations

- [x] **T004** Create Drizzle migration file `lib/db/migrations/0001_ai_generation_tables.sql` with 6 new tables (reference_models, custom_models, jobs, credit_balances, credit_transactions, credit_pricing_config) and all indexes per data-model.md
- [x] **T005** Add schema definitions to `lib/db/schema.ts`: export referenceModels, customModels, jobs, creditBalances, creditTransactions, creditPricingConfig tables with Drizzle syntax
- [x] **T006** [P] Create TypeScript types file `lib/generation/types.ts` with JobType, JobStatus, CustomModelStatus enums and related interfaces
- [x] **T007** [P] Create TypeScript types file `lib/credits/types.ts` with CreditTransactionType, OperationType enums and CreditCostParams interface
- [x] **T008** Run migration: `pnpm db:generate` to generate Drizzle migration metadata (db:migrate requires database connection)

---

## Phase 3.3: Seed Data

- [x] **T009** [P] Create reference models seed script `lib/db/seeds/reference-models.ts` with 50-100 curated models across 5 categories (fashion, fitness, beauty, lifestyle, business)
- [x] **T010** [P] Create credit pricing config seed `lib/db/seeds/credit-pricing.ts` with base costs and multipliers for model_creation, model_refinement, image_generation
- [x] **T011** Update `lib/db/seed.ts` to import and execute new seed scripts
- [x] **T012** Extend team creation in existing codebase to initialize credit_balances row (add to signup flow or team creation logic)

---

## Phase 3.4: External Service Integrations

### fal.ai Client
- [x] **T013** [P] Create fal.ai client wrapper `lib/generation/fal-client.ts` with initialize(), createModel(), refineModel(), generateImage() methods using `@fal-ai/serverless-client`
- [x] **T014** [P] Add webhook signature validation helper in `lib/generation/fal-client.ts` for fal.ai webhook security

### S3 Storage
- [x] **T015** [P] Create S3 client `lib/storage/s3-client.ts` with uploadImage(), getPresignedUrl(), deleteImage() methods using AWS SDK v3
- [x] **T016** [P] Create image storage service `lib/storage/image-storage.ts` with saveGeneratedImage(), getImageUrl() that wraps S3 client and adds metadata
- [x] **T017** [P] Create S3 lifecycle cleanup script `lib/storage/cleanup.ts` with cleanupExpiredImages() cron function (marks jobs as expired after 90 days)

### Redis & Queue Setup
- [x] **T018** [P] Create Redis connection `lib/queue/redis.ts` with ioredis client configuration
- [x] **T019** Create BullMQ queue setup `lib/queue/queue.ts` with aiJobsQueue initialization, priority configuration, and retry settings

---

## Phase 3.5: Credit Management System

- [x] **T020** [P] Create credit cost calculator `lib/credits/calculator.ts` with calculateModelCreationCost(), calculateRefinementCost(), calculateImageGenerationCost() using pricing config formulas from research.md
- [x] **T021** Create credit transaction service `lib/credits/transactions.ts` with reserveCredits(), deductCredits(), refundCredits() using PostgreSQL transactions with row-level locking (FOR UPDATE pattern)
- [x] **T022** Create credit service layer `lib/credits/credit-service.ts` with getBalance(), getTransactionHistory(), canAfford() helper methods
- [x] **T023** [P] Add credit balance query helpers to `lib/db/queries.ts`: getCreditBalance(teamId), getActiveJobsCount(teamId)

---

## Phase 3.6: Job Queue Processors

- [x] **T024** [P] Create model creation processor `lib/queue/processors/model-creation.ts` that calls fal.ai, updates custom_models table, deducts credits on success, refunds on failure
- [x] **T025** [P] Create model refinement processor `lib/queue/processors/model-refinement.ts` that calls fal.ai, updates custom_models version and refinementHistory, handles credits
- [x] **T026** [P] Create image generation processor `lib/queue/processors/image-generation.ts` that calls fal.ai, uploads to S3, sets expiresAt to +90 days, handles credits
- [x] **T027** Create job management service `lib/queue/jobs.ts` with createJob(), getJobStatus(), cancelJob(), updateJobProgress() methods
- [x] **T028** Create BullMQ worker `lib/queue/worker.ts` that routes job types to correct processor and enforces plan-based concurrency limits

---

## Phase 3.7: API Endpoints - Reference Models

- [x] **T029** [P] Create GET /api/reference-models endpoint in `app/api/reference-models/route.ts` to list catalog with category filtering, pagination, popularity sorting
- [x] **T030** [P] Create GET /api/reference-models/[id] endpoint in `app/api/reference-models/[id]/route.ts` to fetch single reference model details

---

## Phase 3.8: API Endpoints - Custom Models

- [x] **T031** Create POST /api/models endpoint in `app/api/models/route.ts` to create custom model (validate credits, reserve, queue job, return jobId)
- [x] **T032** Extend `app/api/models/route.ts` with GET handler to list team's custom models with status filtering
- [x] **T033** [P] Create GET /api/models/[id] endpoint in `app/api/models/[id]/route.ts` to fetch custom model details with refinement history
- [x] **T034** [P] Create PATCH /api/models/[id] endpoint in `app/api/models/[id]/route.ts` to update model metadata (name, description only)
- [x] **T035** [P] Create DELETE /api/models/[id] endpoint in `app/api/models/[id]/route.ts` to soft-delete custom model
- [x] **T036** Create POST /api/models/[id]/refine endpoint in `app/api/models/[id]/refine/route.ts` to queue refinement job (validate credits, reserve, increment version)

---

## Phase 3.9: API Endpoints - Image Generation

- [x] **T037** Create POST /api/generate endpoint in `app/api/generate/route.ts` to queue image generation job (validate model ready, credits sufficient, check concurrency limit, reserve credits)
- [x] **T038** [P] Create GET /api/generate/[jobId] endpoint in `app/api/generate/[jobId]/route.ts` to fetch job status and result (presigned S3 URL if completed)

---

## Phase 3.10: API Endpoints - Job Management

- [x] **T039** Create GET /api/jobs endpoint in `app/api/jobs/route.ts` to list team's jobs with filtering by status, jobType, pagination
- [x] **T040** [P] Create GET /api/jobs/[id] endpoint in `app/api/jobs/[id]/route.ts` to fetch single job with credit transaction details
- [x] **T041** [P] Create DELETE /api/jobs/[id] endpoint in `app/api/jobs/[id]/route.ts` to cancel queued job (refund credits if not started)

---

## Phase 3.11: API Endpoints - Credits

- [x] **T042** [P] Create GET /api/credits/balance endpoint in `app/api/credits/balance/route.ts` to return current available, reserved, bonus credits
- [x] **T043** [P] Create GET /api/credits/history endpoint in `app/api/credits/history/route.ts` to return paginated credit transaction history with operation details

---

## Phase 3.12: Webhooks

- [x] **T044** Create POST /api/webhooks/fal endpoint in `app/api/webhooks/fal/route.ts` to handle fal.ai callbacks (validate signature, update job status, trigger credit deduction, upload images to S3)

---

## Phase 3.13: Stripe Integration Extension

- [x] **T045** Extend `lib/payments/stripe.ts` webhook handler to call replenishTeamCredits() on `invoice.payment_succeeded` event (monthly renewal)
- [x] **T046** Create credit replenishment function in `lib/credits/credit-service.ts`: replenishTeamCredits(teamId) that resets available credits, clears bonus, updates next replenishment date

---

## Phase 3.14: Frontend UI Components (Dashboard)

- [ ] **T047** [P] Create models list page `app/(dashboard)/models/page.tsx` with card grid, status badges, search/filter by category
- [ ] **T048** [P] Create model creation flow `app/(dashboard)/models/create/page.tsx` with reference model selector, description textarea, cost estimator
- [ ] **T049** [P] Create model detail page `app/(dashboard)/models/[id]/page.tsx` with refinement UI, version history, delete button
- [ ] **T050** [P] Create image generation page `app/(dashboard)/generate/page.tsx` with model selector, prompt input, queue status, generated images grid
- [ ] **T051** [P] Create credits dashboard `app/(dashboard)/credits/page.tsx` with balance display, transaction history table, plan comparison

---

## Phase 3.15: Polish & Validation

- [x] **T052** [P] Update `CLAUDE.md` with new feature context: add API routes, database tables, job queue patterns, credit system to Architecture section

---

## Dependencies

**Critical Path**:
```
T001-T003 (setup)
  ↓
T004-T008 (migrations)
  ↓
T009-T012 (seed data)
  ↓
T013-T019 (external services)
  ↓
T020-T023 (credit system) ← blocks all API endpoints
  ↓
T024-T028 (queue processors) ← blocks job creation endpoints
  ↓
T029-T046 (API endpoints & webhooks)
  ↓
T047-T051 (UI)
  ↓
T052 (documentation)
```

**Blocking Relationships**:
- T008 blocks T009-T012 (migration must run before seeds)
- T020-T023 block T031, T036, T037 (credit system needed for job creation)
- T024-T028 block T031, T036, T037, T044 (processors needed for queue operations)
- T013 blocks T024-T026 (fal.ai client needed by processors)
- T015-T016 blocks T026, T044 (S3 storage needed for image generation)
- T045 requires T046 (Stripe webhook needs replenishment function)

**Parallel Groups**:
- **Group 1** (T002, T003): Configuration files
- **Group 2** (T006, T007): Type definitions
- **Group 3** (T009, T010): Seed scripts
- **Group 4** (T013-T017): External service integrations (fal.ai, S3)
- **Group 5** (T024-T026): Queue processors
- **Group 6** (T029-T030, T033-T035, T038, T040-T043): Independent API endpoints
- **Group 7** (T047-T051): UI pages

---

## Parallel Execution Examples

### Example 1: External Services (after T012)
```bash
# Launch T013, T015, T018 together (different services, no overlap):
Task: "Create fal.ai client wrapper lib/generation/fal-client.ts"
Task: "Create S3 client lib/storage/s3-client.ts"
Task: "Create Redis connection lib/queue/redis.ts"
```

### Example 2: Queue Processors (after T023)
```bash
# Launch T024-T026 together (separate files):
Task: "Create model creation processor lib/queue/processors/model-creation.ts"
Task: "Create model refinement processor lib/queue/processors/model-refinement.ts"
Task: "Create image generation processor lib/queue/processors/image-generation.ts"
```

### Example 3: CRUD Endpoints (after T028)
```bash
# Launch T033-T035 together (different routes):
Task: "Create GET /api/models/[id] endpoint"
Task: "Create PATCH /api/models/[id] endpoint"
Task: "Create DELETE /api/models/[id] endpoint"
```

### Example 4: UI Pages (after T046)
```bash
# Launch T047-T051 together (independent pages):
Task: "Create models list page app/(dashboard)/models/page.tsx"
Task: "Create model creation flow app/(dashboard)/models/create/page.tsx"
Task: "Create image generation page app/(dashboard)/generate/page.tsx"
Task: "Create credits dashboard app/(dashboard)/credits/page.tsx"
```

---

## Testing Strategy (TDD)

**Note**: This implementation uses an existing Next.js codebase without a formal test suite setup. Tests should be added incrementally:

### Contract Tests (Future Enhancement)
- Each API endpoint should have contract tests in `tests/contract/`
- Validate request/response schemas, auth requirements, credit deductions

### Integration Tests (Future Enhancement)
- Test full workflows: model creation → refinement → image generation
- Test credit flows: reservation → deduction → refund
- Test concurrency limits enforcement
- Test 90-day expiration cleanup

### Manual Testing Checklist
After T046, manually verify:
1. Create custom model (check credit deduction)
2. Refine model (check version increment)
3. Generate image (check S3 upload + 90-day expiry)
4. Check credit balance updates
5. Test concurrency limits (queue multiple jobs)
6. Test subscription renewal (Stripe webhook)

---

## Environment Setup

**Required Services**:
- PostgreSQL (existing)
- Redis 7.x (new - for BullMQ)
- AWS S3 bucket (new - configure lifecycle policy for 90-day deletion)
- CloudFront distribution (new - point to S3 bucket)

**Required API Keys**:
- `FAL_KEY`: fal.ai API key from https://fal.ai/dashboard
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: AWS credentials with S3 permissions
- Existing Stripe keys

**One-time Setup**:
```bash
# 1. Install dependencies
pnpm install

# 2. Setup Redis locally (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# 3. Configure AWS S3 bucket lifecycle
aws s3api put-bucket-lifecycle-configuration \
  --bucket YOUR_BUCKET \
  --lifecycle-configuration file://s3-lifecycle-policy.json

# 4. Run migrations
pnpm db:migrate

# 5. Seed data
pnpm db:seed

# 6. Start worker process (separate terminal)
node --loader ts-node/esm lib/queue/worker.ts
```

---

## Notes

- **Queue Worker**: Must run as separate process (T028 creates worker.ts, run it alongside Next.js dev server)
- **Webhook URL**: fal.ai webhooks require publicly accessible URL (use ngrok for local dev)
- **S3 Lifecycle**: Configure in AWS Console or via CLI (not in code)
- **Credit Atomicity**: All credit operations use PostgreSQL transactions with `FOR UPDATE` locking
- **Concurrency Limits**: Enforced at API layer (check active jobs) + queue layer (BullMQ groups)
- **90-day Retention**: Automatic via S3 lifecycle + cron job to update DB records

---

## Validation Checklist

**Before marking complete**:
- [ ] All 6 database tables created with indexes
- [ ] Reference models catalog seeded (50+ models)
- [ ] Credit pricing config seeded
- [ ] fal.ai integration tested (model creation works)
- [ ] S3 upload tested (images stored with presigned URLs)
- [ ] BullMQ queue processing tested (jobs execute)
- [ ] Credit transactions atomic (no double-spending)
- [ ] Concurrency limits enforced (plan-based)
- [ ] Stripe webhook triggers credit replenishment
- [ ] 90-day expiration cleanup script deployed as cron

---

**Generated**: 2025-10-04
**Next Step**: Begin T001 (install dependencies)
