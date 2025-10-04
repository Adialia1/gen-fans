# Implementation Plan: AI Image Generation with Credit Management

**Branch**: `001-build-an-api` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-an-api/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Spec loaded with comprehensive clarifications
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → SUCCESS: All clarifications resolved in spec
   → Project Type: Web application (Next.js fullstack)
   → Structure Decision: Existing Next.js App Router structure
3. Fill the Constitution Check section
   → SKIPPED: Constitution is template only
4. Evaluate Constitution Check section
   → PASS: No violations (template constitution)
   → Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → IN PROGRESS
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md update
   → PENDING
7. Re-evaluate Constitution Check
   → PENDING
8. Plan Phase 2 → Describe task generation approach
   → PENDING
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Build a comprehensive AI image generation system with three credit-consuming operations:
1. **Custom Model Creation**: Users describe ideal model/influencer, select reference from catalog, AI generates custom model
2. **Model Refinement**: Users improve existing models through additional prompting
3. **Image Generation**: Users generate images using custom models with text prompts

All operations use unified job queue with plan-based concurrency limits, credit reservation/deduction, S3 storage with 90-day retention, and fal.ai integration.

## Technical Context

**Language/Version**: TypeScript 5.8.3 with Next.js 15.4.0-canary.47
**Primary Dependencies**:
- Next.js 15 (App Router with PPR, client segment cache)
- Drizzle ORM 0.43.1 with PostgreSQL
- fal.ai SDK (for AI generation)
- AWS SDK v3 (for S3 storage)
- BullMQ or similar for job queue
- Stripe 18.1.0 (existing payment integration)

**Storage**:
- PostgreSQL (existing via Drizzle ORM) for relational data
- S3 for generated images and model assets
- Redis for job queue state

**Testing**: Vitest or Jest for unit tests, Playwright for E2E
**Target Platform**: Web (Linux server deployment)
**Project Type**: Web (fullstack Next.js application)

**Performance Goals**:
- API response time: <200ms p95 for non-generation endpoints
- Queue processing: Support 100+ concurrent jobs across all plans
- Image generation: No timeout (handled by fal.ai)
- Credit operations: Atomic transactions with <50ms p95

**Constraints**:
- 90-day image retention (automatic deletion)
- Plan-based concurrency (Free: 0, Basic: 1, Pro: 3, Enterprise: 10)
- No timeouts on generation jobs
- Credit reservation must be atomic
- Job persistence across restarts required

**Scale/Scope**:
- Support 10,000+ teams
- Handle 100,000+ jobs/day
- 1M+ generated images with TTL cleanup
- Reference model catalog: ~50-100 models initially

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: PASS (Constitution file is template only - no specific constraints to enforce)

**Notes**: No project-specific constitutional constraints defined. Following Next.js best practices and existing codebase patterns from CLAUDE.md.

## Project Structure

### Documentation (this feature)
```
specs/001-build-an-api/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── openapi.yaml     # Complete API specification
│   ├── jobs.schema.json # Job queue contracts
│   └── webhooks.schema.json # External service contracts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── (dashboard)/
│   ├── models/                    # NEW: Custom model management UI
│   │   ├── page.tsx              # Model list view
│   │   ├── [id]/                 # Model detail/refinement
│   │   ├── create/               # Model creation flow
│   │   └── components/           # Model-specific UI components
│   ├── generate/                  # NEW: Image generation UI
│   │   ├── page.tsx              # Generation interface
│   │   ├── [jobId]/              # Job status/results
│   │   └── components/           # Generation UI components
│   ├── history/                   # NEW: Operation history
│   └── credits/                   # NEW: Credit management UI
└── api/
    ├── models/                    # NEW: Model CRUD endpoints
    │   ├── route.ts              # GET (list), POST (create)
    │   ├── [id]/route.ts         # GET, PATCH, DELETE
    │   └── [id]/refine/route.ts  # POST refinement
    ├── generate/                  # NEW: Image generation endpoints
    │   ├── route.ts              # POST generation request
    │   └── [jobId]/route.ts      # GET status, result
    ├── jobs/                      # NEW: Job management
    │   ├── route.ts              # GET job list
    │   └── [id]/route.ts         # GET status, DELETE cancel
    ├── credits/                   # NEW: Credit operations
    │   ├── balance/route.ts      # GET current balance
    │   └── history/route.ts      # GET transaction history
    ├── reference-models/          # NEW: Reference catalog
    │   └── route.ts              # GET catalog
    └── webhooks/
        └── fal/route.ts          # NEW: fal.ai webhook handler

lib/
├── db/
│   ├── schema.ts                 # EXTEND: Add new tables
│   ├── queries.ts                # EXTEND: Add new queries
│   └── migrations/               # NEW: Migration files
├── generation/                    # NEW: AI generation service layer
│   ├── fal-client.ts             # fal.ai API wrapper
│   ├── model-service.ts          # Model creation/refinement logic
│   ├── image-service.ts          # Image generation logic
│   └── types.ts                  # Generation types
├── queue/                         # NEW: Job queue system
│   ├── queue.ts                  # BullMQ setup
│   ├── processors/               # Job processors
│   │   ├── model-creation.ts
│   │   ├── model-refinement.ts
│   │   └── image-generation.ts
│   ├── jobs.ts                   # Job creation/management
│   └── types.ts                  # Queue types
├── credits/                       # NEW: Credit management
│   ├── credit-service.ts         # Credit operations
│   ├── calculator.ts             # Cost calculation
│   ├── transactions.ts           # Transaction management
│   └── types.ts                  # Credit types
├── storage/                       # NEW: S3 integration
│   ├── s3-client.ts              # S3 operations
│   ├── image-storage.ts          # Image upload/retrieval
│   └── cleanup.ts                # 90-day retention cleanup
└── payments/
    └── stripe.ts                 # EXTEND: Add credit replenishment

tests/
├── contract/                      # NEW: API contract tests
│   ├── models.test.ts
│   ├── generate.test.ts
│   ├── credits.test.ts
│   └── jobs.test.ts
├── integration/                   # NEW: Integration tests
│   ├── model-creation.test.ts
│   ├── model-refinement.test.ts
│   ├── image-generation.test.ts
│   ├── credit-flow.test.ts
│   └── queue-processing.test.ts
└── unit/                          # NEW: Unit tests
    ├── credit-calculator.test.ts
    ├── job-processor.test.ts
    └── storage.test.ts
```

**Structure Decision**: Using existing Next.js App Router structure. New feature adds parallel routes under `app/(dashboard)/` for authenticated UI and `app/api/` for REST endpoints. Service layer logic in `lib/` follows existing patterns (auth, payments). Job queue and generation services are new domains.

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE

### Research Tasks Completed

#### 1. fal.ai Integration Research
**Decision**: Use `@fal-ai/serverless-client` SDK
**Rationale**:
- Official SDK with TypeScript support
- Built-in retry logic and error handling
- Supports async job submission and webhook callbacks
- Handles model creation and image generation endpoints

**Alternatives considered**:
- Direct REST API calls: More control but requires manual retry/webhook logic
- Replicate.com: Similar capabilities but fal.ai already mentioned in spec

**Implementation approach**:
- Initialize client with API key from env
- Use `fal.subscribe()` for async operations with webhooks
- Handle model training via `fal.run()` for custom model creation
- Image generation via standard image generation models with custom model reference

#### 2. Job Queue Solution
**Decision**: Use BullMQ with Redis
**Rationale**:
- Native TypeScript support
- Excellent job persistence and retry mechanisms
- Built-in concurrency control per queue
- Handles job priorities and delayed jobs
- Active maintenance and Next.js compatibility

**Alternatives considered**:
- Inngest: Great for serverless but adds external dependency
- pg-boss: PostgreSQL-based but less performant for high-volume jobs
- AWS SQS: Adds AWS complexity and cost

**Implementation approach**:
- Single queue with job types (model_creation, model_refinement, image_generation)
- Priority based on subscription plan
- Concurrency limits enforced per team via rate limiting
- Job state persisted in Redis with PostgreSQL as source of truth

#### 3. S3 Storage Strategy
**Decision**: AWS S3 with CloudFront CDN
**Rationale**:
- Industry standard with excellent reliability
- Lifecycle policies for automatic 90-day deletion
- CloudFront integration for fast global delivery
- Cost-effective for large media storage

**Alternatives considered**:
- Vercel Blob: Simpler but more expensive at scale
- Cloudflare R2: Good pricing but less mature
- Direct server storage: Not scalable or reliable

**Implementation approach**:
- Organized buckets: `generated-images`, `model-assets`, `reference-models`
- Lifecycle rule: Delete objects >90 days old
- Presigned URLs for secure temporary access
- CloudFront distribution for CDN delivery

#### 4. Credit Cost Calculation
**Decision**: Tiered pricing with metadata-driven configuration
**Rationale**:
- Flexible: Costs stored in database, adjustable without code changes
- Transparent: Credit costs returned in API responses
- Fair: Variable pricing based on actual resource consumption

**Formula**:
```
Model Creation Cost = base_cost + (reference_complexity_multiplier * complexity_factor)
Model Refinement Cost = base_cost + (refinement_scope_multiplier * iteration_count)
Image Generation Cost = base_cost + (resolution_multiplier + quality_multiplier) * model_complexity
```

**Configuration storage**:
- `pricing_config` table with operation_type, base_cost, multipliers
- Updated via admin API (future enhancement)
- Cached in Redis for fast lookups

#### 5. Concurrency Control
**Decision**: Multi-level rate limiting
**Rationale**:
- Team-level concurrency via BullMQ group limits
- Plan-tier enforcement at API layer
- Redis-based distributed counting for accuracy

**Implementation**:
```
Plan Limits (concurrent jobs):
- Free: 0 (blocked at API)
- Basic: 1
- Pro: 3
- Enterprise: 10
```

**Enforcement points**:
1. API validation: Check current team concurrency before queuing
2. Queue processor: Respect plan limits when dequeuing jobs
3. Webhook handler: Update concurrency counter on completion

#### 6. Credit Transaction Atomicity
**Decision**: PostgreSQL transactions with row-level locking
**Rationale**:
- ACID guarantees prevent double-spending
- Row-level locks prevent race conditions
- Drizzle ORM supports transactions natively

**Pattern**:
```typescript
await db.transaction(async (tx) => {
  // 1. Lock team credit balance
  const balance = await tx.select()
    .from(creditBalance)
    .where(eq(creditBalance.teamId, teamId))
    .for('update');

  // 2. Validate sufficient credits
  if (balance.available < cost) throw new Error('Insufficient credits');

  // 3. Reserve credits
  await tx.update(creditBalance)
    .set({ reserved: balance.reserved + cost })
    .where(eq(creditBalance.teamId, teamId));

  // 4. Create transaction record
  await tx.insert(creditTransaction).values({...});

  // 5. Create job
  await tx.insert(jobs).values({...});
});
```

#### 7. Reference Model Catalog
**Decision**: Seed-based static catalog with future admin CRUD
**Rationale**:
- Initial launch: 50-100 curated reference models
- Seeded during `pnpm db:seed`
- Future: Admin UI for adding/managing references

**Catalog structure**:
```
Reference Model attributes:
- id, name, category (e.g., "Fashion", "Fitness", "Beauty")
- preview_images (S3 URLs)
- characteristics (JSON: age_range, style, ethnicity, etc.)
- complexity_factor (affects creation cost)
- popularity_score (for sorting)
- active status
```

**Categories**:
- Fashion Models
- Fitness Influencers
- Beauty Creators
- Lifestyle Influencers
- Business Professionals

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

### Outputs Generated

All Phase 1 artifacts have been created in `/specs/001-build-an-api/`:

1. ✅ **data-model.md**: Complete database schema with 6 new tables
2. ✅ **contracts/openapi.yaml**: Full REST API specification (23 endpoints)
3. ✅ **contracts/jobs.schema.json**: Job queue message schemas
4. ✅ **contracts/webhooks.schema.json**: fal.ai webhook contracts
5. ✅ **quickstart.md**: Step-by-step validation guide
6. ✅ **CLAUDE.md**: Updated with new feature context (incremental update)

### Design Summary

**Database Additions** (6 tables):
- `reference_models`: System catalog of base models
- `custom_models`: User-generated AI models
- `jobs`: Unified async operation tracking
- `credit_balances`: Team credit state
- `credit_transactions`: Audit trail
- `credit_pricing_config`: Dynamic cost configuration

**API Design** (23 new endpoints):
- 8 model endpoints (CRUD + refinement)
- 4 generation endpoints
- 5 job management endpoints
- 3 credit endpoints
- 2 reference catalog endpoints
- 1 webhook endpoint

**Key Design Decisions**:
1. **Unified Job Entity**: Single table for all async operations (model/image) with discriminated types
2. **Credit Atomicity**: PostgreSQL transactions with row-level locking
3. **Queue Architecture**: BullMQ with Redis for job state, PostgreSQL for durability
4. **Storage Hierarchy**: S3 buckets organized by content type, CloudFront for delivery
5. **API Patterns**: REST with resource-oriented URLs, consistent error responses

### Contract Test Generation

Generated 23 failing contract tests (TDD approach):
- Request/response schema validation
- Authentication requirements
- Credit validation flows
- Queue state transitions

Tests located in: `tests/contract/`

### Integration Test Scenarios

Extracted from acceptance scenarios (12 tests):
- Model creation → refinement → image generation flow
- Credit reservation → deduction → refund flow
- Concurrency limit enforcement
- Subscription expiry mid-job handling
- 90-day image retention verification

Tests located in: `tests/integration/`

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. **Load base template**: `.specify/templates/tasks-template.md`

2. **Generate database tasks** (from data-model.md):
   - Task: Create migration for 6 new tables [P]
   - Task: Seed reference model catalog [P]
   - Task: Add credit balance initialization to team creation
   - Task: Create credit pricing config seed data

3. **Generate contract implementation tasks** (from contracts/):
   - For each of 23 endpoints → contract test task [P]
   - For each endpoint → implementation task (dependency: test + model)
   - Webhook handler task with retry logic

4. **Generate service layer tasks**:
   - Task: Implement fal.ai client wrapper
   - Task: Implement credit calculation service
   - Task: Implement S3 storage service with lifecycle
   - Task: Implement job queue setup and processors
   - Task: Implement credit transaction service

5. **Generate integration test tasks**:
   - One task per user story (12 total)
   - Each references contract tests and services
   - Ordered by dependency (models → queue → credits → UI)

6. **Generate UI tasks**:
   - Task: Models list page [P]
   - Task: Model creation flow [P]
   - Task: Model refinement UI [P]
   - Task: Generation interface [P]
   - Task: Job status tracking [P]
   - Task: Credit dashboard [P]

**Ordering Strategy**:
1. Database migrations and seeds (foundation)
2. Contract tests (TDD - must fail initially)
3. Service layer (fal.ai, credits, storage, queue) [parallel where possible]
4. API endpoint implementations (make tests pass)
5. Integration tests (validate flows)
6. UI components [parallel]
7. E2E validation via quickstart.md

**Parallelization Markers**:
- [P] Contract tests (independent)
- [P] Service implementations (low coupling)
- [P] UI components (separate routes)
- [P] Seed scripts (independent data)

**Estimated Output**: 45-50 numbered, dependency-ordered tasks in tasks.md

**Dependencies**:
- External: fal.ai API key, AWS credentials, Redis instance
- Internal: Existing Stripe webhook for credit replenishment

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD principles)
**Phase 5**: Validation (run tests, execute quickstart.md, verify 90-day retention cron)

## Complexity Tracking
*No constitutional violations - constitution file is template only*

**Architectural Complexity Justifications**:

| Component | Complexity | Justification | Alternative Rejected |
|-----------|------------|---------------|---------------------|
| BullMQ Queue | Additional Redis dependency | Required for job persistence, retry, and concurrency control across restarts | In-memory queue: Loses jobs on restart |
| Unified Job Table | Polymorphic entity with discriminator | Simplifies queue processing and status tracking vs. separate tables | 3 job tables: Complex joins and duplicate queue logic |
| Credit Transactions | Separate audit table | Required for compliance and debugging credit issues | Inline in balance: No audit trail |
| S3 + CloudFront | External storage dependency | Generated images too large for DB, CDN required for global performance | Local storage: Not scalable or fast |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - 52 tasks created
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Plan generated: 2025-10-04 | Next step: Run `/tasks` to generate tasks.md*
