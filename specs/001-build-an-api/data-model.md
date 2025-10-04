# Data Model: AI Image Generation with Credit Management

**Feature**: Custom Model Creation + Image Generation System
**Date**: 2025-10-04
**Status**: Complete

## Overview

This data model extends the existing GenFans schema (users, teams, teamMembers, activityLogs, invitations) with 6 new tables supporting AI image generation, custom model management, and credit-based billing.

## Entity Relationship Diagram

```
┌─────────────────┐
│  teams (existing)│──┐
└─────────────────┘  │
                     │ 1:1
                     ▼
           ┌──────────────────┐
           │ credit_balances  │
           └──────────────────┘
                     │ 1:N
                     ▼
           ┌────────────────────┐
           │credit_transactions │
           └────────────────────┘
                     ▲
                     │ N:1
           ┌─────────┴──────┐
           │      jobs      │──────┐
           └────────────────┘      │
                │                  │ N:1
                │ N:1              ▼
                ▼           ┌──────────────┐
        ┌──────────────┐   │custom_models │
        │reference_    │   └──────────────┘
        │  models      │          ▲
        └──────────────┘          │ N:1
                                  │
                         ┌────────┴───────┐
                         │ teams (FK)     │
                         └────────────────┘

┌───────────────────────┐
│ credit_pricing_config │  (Singleton/Static)
└───────────────────────┘
```

## Table Schemas

### 1. reference_models

System-managed catalog of base models/influencers for custom model creation.

```typescript
// Drizzle Schema
export const referenceModels = pgTable('reference_models', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'fashion', 'fitness', 'beauty', etc.
  description: text('description'),
  previewImages: text('preview_images').array().notNull(), // S3 URLs
  characteristics: jsonb('characteristics').notNull(), // { ageRange, style, bodyType, etc. }
  complexityFactor: numeric('complexity_factor', { precision: 3, scale: 2 }).notNull().default('1.0'),
  popularityScore: integer('popularity_score').notNull().default(0), // For sorting
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type ReferenceModel = typeof referenceModels.$inferSelect;
export type NewReferenceModel = typeof referenceModels.$inferInsert;
```

**Indexes**:
```sql
CREATE INDEX idx_reference_models_category_active ON reference_models(category, active);
CREATE INDEX idx_reference_models_popularity ON reference_models(popularity_score DESC) WHERE active = true;
```

**Validation Rules**:
- `name`: Required, max 100 chars
- `category`: One of ['fashion', 'fitness', 'beauty', 'lifestyle', 'business']
- `complexityFactor`: 1.0 (simple) to 2.0 (complex)
- `previewImages`: 1-5 S3 URLs

**Sample Data**:
```json
{
  "name": "Sophia - Fashion Model",
  "category": "fashion",
  "description": "High-fashion runway model with versatile looks",
  "previewImages": ["s3://ref-models/sophia-1.jpg", "s3://ref-models/sophia-2.jpg"],
  "characteristics": {
    "ageRange": "20-30",
    "style": "high-fashion",
    "bodyType": "athletic",
    "ethnicity": "caucasian"
  },
  "complexityFactor": 1.5,
  "popularityScore": 100,
  "active": true
}
```

---

### 2. custom_models

User-generated AI models created from reference models + user descriptions.

```typescript
export const customModels = pgTable('custom_models', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  referenceModelId: integer('reference_model_id').notNull().references(() => referenceModels.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  creationPrompt: text('creation_prompt').notNull(), // User's original description
  refinementHistory: jsonb('refinement_history').notNull().default([]), // Array of { prompt, timestamp, jobId }
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'generating', 'ready', 'failed'
  falLoraId: text('fal_lora_id'), // fal.ai LoRA model ID (when ready)
  version: integer('version').notNull().default(1), // Incremented on refinements
  metadata: jsonb('metadata'), // { triggerWord, trainingImages, etc. }
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at')
});

export type CustomModel = typeof customModels.$inferSelect;
export type NewCustomModel = typeof customModels.$inferInsert;
```

**Indexes**:
```sql
CREATE INDEX idx_custom_models_team_status ON custom_models(team_id, status);
CREATE INDEX idx_custom_models_team_updated ON custom_models(team_id, updated_at DESC);
CREATE INDEX idx_custom_models_fal_lora ON custom_models(fal_lora_id) WHERE fal_lora_id IS NOT NULL;
```

**Validation Rules**:
- `name`: Required, max 100 chars, unique per team
- `status`: One of ['pending', 'generating', 'ready', 'failed']
- `creationPrompt`: Required, min 10 chars, max 1000 chars
- `version`: Auto-increment on refinements
- `falLoraId`: Populated when status='ready'

**State Transitions**:
```
pending → generating (job started)
generating → ready (job completed, falLoraId assigned)
generating → failed (job failed)
ready → generating (refinement started)
```

---

### 3. jobs

Unified table for all async operations (model creation, refinement, image generation).

```typescript
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  jobType: varchar('job_type', { length: 30 }).notNull(), // 'model_creation', 'model_refinement', 'image_generation'
  customModelId: integer('custom_model_id').references(() => customModels.id, { onDelete: 'set null' }),
  inputParams: jsonb('input_params').notNull(), // Type-specific: { prompt, refModelId } or { prompt, modelId }
  status: varchar('status', { length: 20 }).notNull().default('queued'), // 'queued', 'processing', 'completed', 'failed'
  priority: integer('priority').notNull().default(10), // 1=Enterprise, 5=Pro, 10=Basic
  estimatedCreditCost: numeric('estimated_credit_cost', { precision: 10, scale: 2 }).notNull(),
  actualCreditCost: numeric('actual_credit_cost', { precision: 10, scale: 2 }),
  resultData: jsonb('result_data'), // { imageUrl, modelId, etc. }
  errorDetails: jsonb('error_details'), // { message, code, falError }
  falJobId: text('fal_job_id'), // fal.ai async job ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at') // For images: createdAt + 90 days
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
```

**Indexes**:
```sql
CREATE INDEX idx_jobs_team_status_created ON jobs(team_id, status, created_at DESC);
CREATE INDEX idx_jobs_status_priority ON jobs(status, priority ASC) WHERE status = 'queued';
CREATE INDEX idx_jobs_custom_model ON jobs(custom_model_id) WHERE custom_model_id IS NOT NULL;
CREATE INDEX idx_jobs_fal_job_id ON jobs(fal_job_id) WHERE fal_job_id IS NOT NULL;
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at) WHERE expires_at IS NOT NULL AND status = 'completed';
```

**Validation Rules**:
- `jobType`: One of ['model_creation', 'model_refinement', 'image_generation']
- `status`: One of ['queued', 'processing', 'completed', 'failed']
- `priority`: 1-10 (lower = higher priority)
- `estimatedCreditCost`: >0, calculated before queuing
- `expiresAt`: Set for image_generation jobs (90 days from creation)

**State Transitions**:
```
queued → processing (worker picks up)
processing → completed (job succeeded)
processing → failed (job errored)
```

**inputParams Structure**:
```typescript
// model_creation
{ referenceModelId: 123, prompt: "Athletic woman...", triggerWord: "sophia123" }

// model_refinement
{ customModelId: 456, refinementPrompt: "Add more muscle definition..." }

// image_generation
{ customModelId: 456, prompt: "Woman on beach at sunset", resolution: "1024x1024" }
```

---

### 4. credit_balances

Current credit state per team.

```typescript
export const creditBalances = pgTable('credit_balances', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().unique().references(() => teams.id, { onDelete: 'cascade' }),
  availableCredits: numeric('available_credits', { precision: 10, scale: 2 }).notNull().default('0'),
  reservedCredits: numeric('reserved_credits', { precision: 10, scale: 2 }).notNull().default('0'), // For pending jobs
  bonusCredits: numeric('bonus_credits', { precision: 10, scale: 2 }).notNull().default('0'), // Expire monthly
  totalAllocated: numeric('total_allocated', { precision: 10, scale: 2 }).notNull().default('0'), // From plan
  lastReplenishmentAt: timestamp('last_replenishment_at').notNull().defaultNow(),
  nextReplenishmentAt: timestamp('next_replenishment_at').notNull(), // Subscription renewal date
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type CreditBalance = typeof creditBalances.$inferSelect;
export type NewCreditBalance = typeof creditBalances.$inferInsert;
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_credit_balances_team ON credit_balances(team_id);
CREATE INDEX idx_credit_balances_next_replenishment ON credit_balances(next_replenishment_at) WHERE next_replenishment_at <= NOW();
```

**Invariants**:
- `availableCredits` >= 0 (enforced by transaction validation)
- `reservedCredits` >= 0
- `totalAllocated` = plan credit allocation
- `availableCredits` + `reservedCredits` <= `totalAllocated` + `bonusCredits`

**Credit Flow**:
```
1. Job Queued: available -= cost, reserved += cost
2. Job Completed: reserved -= cost (credits deducted)
3. Job Failed: reserved -= cost, available += cost (refund)
4. Monthly Renewal: available = totalAllocated, bonusCredits = 0
```

---

### 5. credit_transactions

Audit log of all credit movements.

```typescript
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(), // 'reservation', 'deduction', 'refund', 'replenishment', 'bonus'
  operationType: varchar('operation_type', { length: 30 }), // 'model_creation', 'model_refinement', 'image_generation'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Negative for deductions
  balanceBefore: numeric('balance_before', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'), // { jobType, modelId, etc. }
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
```

**Indexes**:
```sql
CREATE INDEX idx_credit_transactions_team_created ON credit_transactions(team_id, created_at DESC);
CREATE INDEX idx_credit_transactions_job ON credit_transactions(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
```

**Transaction Types**:
- `reservation`: Job queued, credits reserved
- `deduction`: Job completed, reserved credits consumed
- `refund`: Job failed, reserved credits returned
- `replenishment`: Monthly subscription renewal
- `bonus`: Manual credit addition (admin/promo)

---

### 6. credit_pricing_config

Dynamic pricing configuration for credit cost calculation.

```typescript
export const creditPricingConfig = pgTable('credit_pricing_config', {
  id: serial('id').primaryKey(),
  operationType: varchar('operation_type', { length: 30 }).notNull().unique(), // 'model_creation', etc.
  baseCost: numeric('base_cost', { precision: 10, scale: 2 }).notNull(),
  multipliers: jsonb('multipliers').notNull(), // { referenceComplexity: 1.5, resolutionHD: 2.0, ... }
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type CreditPricingConfig = typeof creditPricingConfig.$inferSelect;
export type NewCreditPricingConfig = typeof creditPricingConfig.$inferInsert;
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_credit_pricing_operation ON credit_pricing_config(operation_type) WHERE active = true;
```

**Sample Configuration**:
```json
{
  "operationType": "model_creation",
  "baseCost": 50.00,
  "multipliers": {
    "referenceComplexity": 1.5,  // Multiply by reference complexityFactor
    "trainingImagesMultiplier": 0.5  // Extra cost per training image
  },
  "active": true
}
```

---

## Migrations

**Migration Order**:
1. Create `reference_models` (no FK dependencies)
2. Create `credit_pricing_config` (no FK dependencies)
3. Create `custom_models` (FK: teams, reference_models)
4. Create `jobs` (FK: teams, users, custom_models)
5. Create `credit_balances` (FK: teams)
6. Create `credit_transactions` (FK: teams, jobs)

**Migration File**: `lib/db/migrations/001_ai_generation_tables.sql`

---

## Data Lifecycle

### Image Retention (90 Days)

**Cleanup Strategy**:
1. **Database**: Mark jobs with `expiresAt` = `createdAt` + 90 days
2. **S3 Lifecycle Policy**: Automatically delete objects >90 days old
3. **Cron Job**: Daily cleanup of expired job records

```typescript
// Daily cron (lib/storage/cleanup.ts)
export async function cleanupExpiredImages() {
  const expiredJobs = await db.select()
    .from(jobs)
    .where(and(
      eq(jobs.jobType, 'image_generation'),
      eq(jobs.status, 'completed'),
      lte(jobs.expiresAt, new Date())
    ));

  // S3 already deleted via lifecycle policy
  // Just soft-delete job records
  await db.update(jobs)
    .set({ status: 'expired' })
    .where(inArray(jobs.id, expiredJobs.map(j => j.id)));
}
```

### Credit Replenishment (Monthly)

**Triggered By**: Stripe subscription webhook (`invoice.payment_succeeded`)

```typescript
export async function replenishTeamCredits(teamId: number) {
  await db.transaction(async (tx) => {
    const [balance] = await tx.select()
      .from(creditBalances)
      .where(eq(creditBalances.teamId, teamId))
      .for('update');

    const team = await getTeam(teamId);
    const planAllocation = PLAN_CREDITS[team.planName]; // e.g., 1000 for Pro

    await tx.update(creditBalances)
      .set({
        availableCredits: planAllocation,
        bonusCredits: 0, // Expire bonus credits
        totalAllocated: planAllocation,
        lastReplenishmentAt: new Date(),
        nextReplenishmentAt: add(new Date(), { months: 1 })
      })
      .where(eq(creditBalances.teamId, teamId));

    await tx.insert(creditTransactions).values({
      teamId,
      type: 'replenishment',
      amount: planAllocation,
      balanceBefore: balance.availableCredits,
      balanceAfter: planAllocation,
      description: 'Monthly subscription renewal'
    });
  });
}
```

---

## Query Patterns

### Get Team's Available Credits
```typescript
const balance = await db.query.creditBalances.findFirst({
  where: eq(creditBalances.teamId, teamId)
});
return balance.availableCredits + balance.bonusCredits;
```

### List Custom Models for Team
```typescript
const models = await db.query.customModels.findMany({
  where: eq(customModels.teamId, teamId),
  with: {
    referenceModel: true
  },
  orderBy: desc(customModels.updatedAt)
});
```

### Get Job Status with Credit Info
```typescript
const job = await db.query.jobs.findFirst({
  where: eq(jobs.id, jobId),
  with: {
    customModel: true,
    creditTransactions: true
  }
});
```

### Active Jobs Count (Concurrency Check)
```typescript
const activeCount = await db.select({ count: count() })
  .from(jobs)
  .where(and(
    eq(jobs.teamId, teamId),
    inArray(jobs.status, ['queued', 'processing'])
  ));
```

---

## Performance Considerations

**Index Coverage**:
- All FK columns indexed
- Composite indexes for common query patterns
- Partial indexes for filtered queries (WHERE status = 'queued')

**Query Optimization**:
- Use `db.query.*` for relation loading (single query with joins)
- Batch inserts for seed data
- Connection pooling (Drizzle default: 10 connections)

**Expected Load**:
- 100K jobs/day → ~1 insert/sec average, 10-20/sec peak
- Credit transactions: 3x job rate (reservation + deduction + refund)
- Queries: 10-100x reads per write (job status checks)

---

## Next Steps

✅ Data model complete with 6 tables
✅ Indexes and constraints defined
✅ Migration order documented
➡️ Ready for contract generation (OpenAPI spec)
