# Research: AI Image Generation with Credit Management

**Feature**: Custom Model Creation + Image Generation System
**Date**: 2025-10-04
**Status**: Complete

## Research Questions & Findings

### 1. fal.ai API Integration

**Question**: How to integrate fal.ai for model creation and image generation?

**Decision**: Use `@fal-ai/serverless-client` SDK v1.x

**Rationale**:
- Official TypeScript SDK with full type safety
- Built-in retry logic and exponential backoff
- Webhook subscription support for async operations
- Well-documented custom model training endpoints

**Alternatives Considered**:
1. **Direct REST API**: More control but requires implementing retry logic, webhook handling, error normalization
2. **Replicate.com**: Good alternative but not specified in requirements, migration overhead
3. **Stability AI**: Excellent for standard generation but weaker custom model support

**Implementation Details**:
```typescript
import * as fal from "@fal-ai/serverless-client";

// Initialize
fal.config({
  credentials: process.env.FAL_KEY
});

// Model creation (LoRA training)
const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
  input: {
    images_data_url: trainingImagesUrl,
    trigger_word: customModelName,
    ...
  },
  webhookUrl: `${process.env.BASE_URL}/api/webhooks/fal`,
  onQueueUpdate: (update) => {
    // Update job progress
  }
});

// Image generation with custom model
const image = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt: userPrompt,
    loras: [{ path: customModel.falLoraId, scale: 1 }]
  }
});
```

**Documentation**: https://fal.ai/models/fal-ai/flux-lora-fast-training

---

### 2. Job Queue Architecture

**Question**: What queue system supports job persistence, retries, and plan-based concurrency?

**Decision**: BullMQ v5.x with Redis 7.x

**Rationale**:
- **Persistence**: Jobs survive server restarts (Redis AOF/RDB)
- **Concurrency Control**: Built-in per-queue and per-group rate limiting
- **Priority Queues**: Native support for plan-based prioritization
- **Retry Logic**: Configurable backoff strategies
- **Observability**: Built-in metrics and job lifecycle events
- **TypeScript Native**: First-class TS support

**Alternatives Considered**:
1. **Inngest**: Great for serverless but adds external SaaS dependency, costs at scale
2. **pg-boss**: PostgreSQL-based (no Redis) but 10x slower at high volume
3. **AWS SQS**: Managed but higher latency, no built-in concurrency control
4. **In-memory queues**: Zero persistence, unacceptable for paid operations

**Implementation Details**:
```typescript
import { Queue, Worker, QueueScheduler } from 'bullmq';

const aiJobsQueue = new Queue('ai-jobs', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
});

// Add job with priority based on plan
await aiJobsQueue.add('model_creation', jobData, {
  priority: planPriority[team.planName], // 1=Enterprise, 10=Free
  jobId: `model-${uuid}`
});

// Worker with concurrency limits
const worker = new Worker('ai-jobs', async (job) => {
  // Process model_creation, model_refinement, image_generation
}, {
  connection: redis,
  concurrency: 5, // Parallel workers
  limiter: {
    max: 1, // Max jobs per team (enforced via group ID)
    duration: 1000
  }
});
```

**Team-based Concurrency**:
- Use BullMQ groups with `teamId` as groupId
- Set max concurrent jobs per group based on plan tier
- Free tier: Blocked at API layer (concurrency = 0)

---

### 3. S3 Storage & CDN Strategy

**Question**: How to store generated images with 90-day automatic deletion?

**Decision**: AWS S3 with Lifecycle Policies + CloudFront CDN

**Rationale**:
- **Lifecycle Management**: Native 90-day expiration rules (automatic cleanup)
- **Scalability**: Unlimited storage, 99.999999999% durability
- **Cost**: $0.023/GB/month (1M images ~500GB = $11.50/month)
- **CDN Integration**: CloudFront for global low-latency delivery
- **Presigned URLs**: Secure temporary access without proxy overhead

**Alternatives Considered**:
1. **Vercel Blob**: Easier setup but $0.15/GB/month (6.5x more expensive)
2. **Cloudflare R2**: Competitive pricing but less mature lifecycle features
3. **Database BLOBs**: Would balloon PostgreSQL size, slow queries, expensive backups
4. **Local filesystem**: Not scalable, not redundant, complex in multi-server setups

**Bucket Structure**:
```
generated-images/          # User-generated content
  ├── {teamId}/
  │   └── {jobId}-{timestamp}.png
model-assets/              # Custom model files
  ├── {teamId}/
  │   └── {customModelId}/
  │       ├── lora-weights.safetensors
  │       └── preview.jpg
reference-models/          # System catalog
  └── {referenceId}/
      ├── preview-1.jpg
      └── metadata.json
```

**Lifecycle Policy** (applied to `generated-images`):
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>Delete images after 90 days</ID>
    <Status>Enabled</Status>
    <Expiration>
      <Days>90</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

**CDN Setup**:
- CloudFront distribution pointing to S3
- Cache TTL: 1 year (images immutable)
- Presigned URLs bypass CDN for time-limited access

---

### 4. Credit Cost Calculation

**Question**: How to calculate variable costs for model creation, refinement, and generation?

**Decision**: Database-driven pricing with formula-based calculation

**Rationale**:
- **Flexibility**: Change costs without code deployment
- **Transparency**: Return cost estimate in API responses
- **Fairness**: Charge based on actual computational cost
- **Auditability**: All cost calculations logged

**Pricing Formula Design**:

```typescript
// Model Creation
cost = base_cost
  + (reference_complexity_factor * reference_multiplier)
  + (training_image_count_multiplier * num_images)

// Model Refinement
cost = base_cost
  + (refinement_iterations * iteration_multiplier)
  + (model_version * version_complexity_multiplier)

// Image Generation
cost = base_cost
  + (resolution_tier_multiplier * resolution_factor)
  + (quality_setting * quality_multiplier)
  + (custom_model_complexity * model_multiplier)
```

**Pricing Config Table**:
```sql
credit_pricing_config (
  operation_type: 'model_creation' | 'model_refinement' | 'image_generation',
  base_cost: decimal,
  multipliers: jsonb  -- { reference_complexity: 1.5, resolution_hd: 2.0, ... }
)
```

**Example Costs** (initial estimates):
- Model Creation (simple reference): 50 credits
- Model Creation (complex reference): 150 credits
- Model Refinement: 30 credits per iteration
- Image Generation (512x512, normal): 5 credits
- Image Generation (1024x1024, HD): 15 credits

**Caching Strategy**:
- Cache pricing config in Redis (TTL: 1 hour)
- Invalidate on admin updates

---

### 5. Credit Transaction Atomicity

**Question**: How to prevent race conditions in credit reservation/deduction?

**Decision**: PostgreSQL row-level locking with Drizzle transactions

**Rationale**:
- **ACID Guarantees**: Prevents double-spending under concurrent load
- **Row Locking**: `SELECT ... FOR UPDATE` prevents simultaneous modifications
- **Native Support**: Drizzle ORM `.transaction()` method
- **Performance**: <50ms p95 with proper indexing on `teamId`

**Alternatives Considered**:
1. **Optimistic Locking**: Requires retry logic, worse UX on conflicts
2. **Redis Distributed Lock**: Adds complexity, Redis as SPOF for payments
3. **Application-Level Mutex**: Doesn't work across multiple servers

**Transaction Pattern**:
```typescript
await db.transaction(async (tx) => {
  // 1. Lock credit balance row
  const [balance] = await tx.select()
    .from(creditBalances)
    .where(eq(creditBalances.teamId, teamId))
    .for('update');  // Pessimistic lock

  // 2. Validate sufficient credits
  if (balance.availableCredits < estimatedCost) {
    throw new InsufficientCreditsError();
  }

  // 3. Reserve credits (atomic)
  await tx.update(creditBalances)
    .set({
      reservedCredits: balance.reservedCredits + estimatedCost,
      availableCredits: balance.availableCredits - estimatedCost
    })
    .where(eq(creditBalances.teamId, teamId));

  // 4. Create audit record
  await tx.insert(creditTransactions).values({
    teamId,
    type: 'reservation',
    amount: -estimatedCost,
    balanceBefore: balance.availableCredits,
    balanceAfter: balance.availableCredits - estimatedCost,
    relatedJobId: jobId
  });

  // 5. Create job (all-or-nothing)
  await tx.insert(jobs).values({ ... });
});
```

**Index Requirements**:
```sql
CREATE INDEX idx_credit_balances_team ON credit_balances(team_id);
CREATE INDEX idx_credit_transactions_team_ts ON credit_transactions(team_id, created_at DESC);
```

---

### 6. Concurrency Enforcement

**Question**: How to enforce plan-based concurrent job limits?

**Decision**: Multi-layer enforcement (API + Queue + Redis Counter)

**Rationale**:
- **Defense in Depth**: Multiple validation layers prevent circumvention
- **Fair Scheduling**: Plan-based priority ensures Enterprise > Pro > Basic
- **Real-time Tracking**: Redis counter for instant concurrency checks

**Enforcement Layers**:

1. **API Layer** (Primary Gate):
```typescript
// Before queuing job
const activeJobs = await redis.get(`team:${teamId}:active-jobs`);
if (activeJobs >= planLimits[team.planName]) {
  throw new ConcurrencyLimitError();
}
```

2. **Queue Layer** (BullMQ Groups):
```typescript
// Add job with team group
await queue.add(jobType, data, {
  group: { id: `team:${teamId}` }
});

// Worker respects group concurrency
const worker = new Worker(queue, processor, {
  group: {
    concurrency: (groupId) => {
      const teamId = groupId.split(':')[1];
      return getPlanLimit(teamId);
    }
  }
});
```

3. **Job Completion** (Decrement Counter):
```typescript
worker.on('completed', async (job) => {
  await redis.decr(`team:${job.data.teamId}:active-jobs`);
});
```

**Plan Limits**:
```typescript
const PLAN_CONCURRENCY = {
  free: 0,        // Blocked entirely
  basic: 1,       // 1 job at a time
  pro: 3,         // 3 parallel jobs
  enterprise: 10  // 10 parallel jobs
};
```

---

### 7. Reference Model Catalog

**Question**: How to manage the reference model catalog?

**Decision**: Seed-based static catalog with lazy admin CRUD

**Rationale**:
- **MVP Simplicity**: Seeded data sufficient for launch
- **Quality Control**: Manual curation ensures high-quality references
- **Performance**: Static data cached aggressively
- **Future-proof**: Schema supports admin UI when needed

**Catalog Management**:

1. **Initial Seed** (`lib/db/seed.ts`):
```typescript
const referenceModels = [
  {
    name: "Sophia - Fashion Model",
    category: "fashion",
    complexityFactor: 1.2,
    previewImages: ["s3://..."],
    characteristics: {
      ageRange: "20-30",
      style: "high-fashion",
      bodyType: "athletic"
    },
    active: true
  },
  // ... 50-100 curated models
];
```

2. **Categorization**:
- Fashion Models (20)
- Fitness Influencers (15)
- Beauty Creators (15)
- Lifestyle Influencers (10)
- Business Professionals (10)
- Other (10-30)

3. **Future Admin UI**:
- POST /api/admin/reference-models (protected)
- PATCH /api/admin/reference-models/:id
- DELETE (soft delete with `active: false`)

**Complexity Factors** (affects creation cost):
- Simple (1.0): Basic features, minimal detail
- Medium (1.5): Moderate features, good detail
- Complex (2.0): Unique features, high detail

---

## Technical Decisions Summary

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| AI Provider | fal.ai with official SDK | Spec requirement, strong LoRA support |
| Job Queue | BullMQ + Redis | Persistence, concurrency, retry logic |
| Storage | S3 + CloudFront | Lifecycle policies, scalability, CDN |
| Credit Pricing | Database-driven formulas | Flexibility, transparency |
| Atomicity | PostgreSQL row locking | ACID guarantees, simplicity |
| Concurrency | Multi-layer (API+Queue+Redis) | Defense in depth |
| Reference Catalog | Seeded static data | MVP simplicity, quality control |

## Dependencies

**New Dependencies**:
```json
{
  "@fal-ai/serverless-client": "^1.0.0",
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.0",
  "@aws-sdk/client-s3": "^3.450.0",
  "@aws-sdk/s3-request-presigner": "^3.450.0"
}
```

**Infrastructure Requirements**:
- Redis 7.x (for BullMQ)
- AWS S3 bucket with lifecycle policy
- CloudFront distribution
- fal.ai API key
- AWS credentials (S3 access)

## Performance Considerations

**Bottlenecks**:
1. **Credit Transactions**: Mitigated by row-level locking + indexed queries
2. **Queue Throughput**: BullMQ handles 10k jobs/sec with proper Redis sizing
3. **S3 Uploads**: Parallel uploads with presigned URLs (offload from server)

**Optimization Opportunities**:
- Cache pricing config in Redis
- Batch credit transaction logging (async)
- CDN caching for reference model previews

## Security Considerations

1. **Credit Fraud**: Row-level locking prevents double-spending
2. **API Abuse**: Rate limiting per team prevents queue flooding
3. **Storage Access**: Presigned URLs with short TTL (15 min)
4. **Webhook Validation**: Verify fal.ai webhook signatures
5. **Job Isolation**: Queue jobs scoped to teamId, never leak cross-team

## Next Steps

✅ All research questions resolved
✅ Technical stack decided
✅ Dependencies identified
➡️ Ready for Phase 1: Data Model & Contracts
