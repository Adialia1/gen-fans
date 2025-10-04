# API Testing Guide

The backend APIs are complete. Here's how to test them without the frontend.

## Prerequisites

✅ Database migrated and seeded
✅ Test team has 500 credits
✅ Dev server running: `pnpm dev`

## Testing Flow

### 1. Test Reference Models (Public)

```bash
# List all reference models
curl http://localhost:3000/api/reference-models

# Filter by category
curl "http://localhost:3000/api/reference-models?category=fashion"

# Get specific model
curl http://localhost:3000/api/reference-models/1
```

**Expected Response:**
```json
{
  "models": [
    {
      "id": 1,
      "name": "Sophia - High Fashion",
      "category": "fashion",
      "description": "Elite runway model...",
      "complexityFactor": 1.5,
      "popularityScore": 100
    }
  ],
  "pagination": { "total": 25, "hasMore": false }
}
```

---

### 2. Login to Get Session

```bash
# Sign in with test user
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "admin123"
  }' \
  -c cookies.txt \
  -v

# The session cookie is saved to cookies.txt
```

**Expected**: Redirect to `/dashboard` (or session cookie in response)

---

### 3. Check Credit Balance

```bash
curl http://localhost:3000/api/credits/balance \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "teamId": 1,
  "availableCredits": 500.00,
  "reservedCredits": 0.00,
  "bonusCredits": 0.00,
  "totalAllocated": 500.00,
  "usedCredits": 0.00
}
```

---

### 4. Create Custom Model (Costs ~75 credits)

**Without Worker Running (will queue but not process):**

```bash
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "referenceModelId": 1,
    "name": "My Fashion Model",
    "description": "Custom fashion model for my brand",
    "trainingImages": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ],
    "triggerWord": "my_model",
    "trainingSteps": 1000
  }'
```

**Expected Response:**
```json
{
  "customModel": {
    "id": 1,
    "name": "My Fashion Model",
    "status": "pending",
    "version": 1
  },
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "model_creation",
    "estimatedCredits": 75.00
  }
}
```

**Check Credits (should be reserved):**
```bash
curl http://localhost:3000/api/credits/balance -b cookies.txt
```

**Expected:**
```json
{
  "availableCredits": 425.00,  // 500 - 75
  "reservedCredits": 75.00      // Reserved for the job
}
```

---

### 5. Check Job Status

```bash
# Get job by ID (use ID from previous response)
curl http://localhost:3000/api/generate/550e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

**Expected (without worker running):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "model_creation",
  "status": "queued",
  "estimatedCredits": 75.00,
  "queuedAt": "2025-10-04T12:00:00Z"
}
```

---

### 6. List All Jobs

```bash
# Get all jobs for the team
curl http://localhost:3000/api/jobs -b cookies.txt

# Filter by status
curl "http://localhost:3000/api/jobs?status=queued" -b cookies.txt

# Filter by type
curl "http://localhost:3000/api/jobs?jobType=model_creation" -b cookies.txt
```

**Expected Response:**
```json
{
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "jobType": "model_creation",
      "status": "queued",
      "estimatedCredits": 75.00,
      "queuedAt": "2025-10-04T12:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0 }
}
```

---

### 7. Cancel Queued Job (Get Refund)

```bash
curl -X DELETE http://localhost:3000/api/jobs/550e8400-e29b-41d4-a716-446655440000 \
  -b cookies.txt
```

**Expected Response:**
```json
{ "success": true }
```

**Check credits (should be refunded):**
```bash
curl http://localhost:3000/api/credits/balance -b cookies.txt
```

**Expected:**
```json
{
  "availableCredits": 500.00,   // Refunded!
  "reservedCredits": 0.00
}
```

---

### 8. Check Credit History

```bash
curl http://localhost:3000/api/credits/history -b cookies.txt
```

**Expected Response:**
```json
{
  "transactions": [
    {
      "id": 3,
      "transactionType": "refund",
      "amount": 75.00,
      "operationType": null,
      "createdAt": "2025-10-04T12:05:00Z"
    },
    {
      "id": 2,
      "transactionType": "deduction",
      "amount": 75.00,
      "operationType": "model_creation",
      "createdAt": "2025-10-04T12:01:00Z"
    },
    {
      "id": 1,
      "transactionType": "reservation",
      "amount": 75.00,
      "operationType": "model_creation",
      "createdAt": "2025-10-04T12:00:00Z"
    }
  ]
}
```

---

## Testing WITH Worker (Full Flow)

### Step 1: Setup Environment Variables

You need these for the worker to process jobs:

```bash
# .env
FAL_KEY=fal_***                    # Get from https://fal.ai/dashboard
REDIS_URL=rediss://...             # Already configured (Upstash)
POSTGRES_URL=postgresql://...      # Already configured
```

### Step 2: Start Worker

```bash
# Terminal 2 (keep running)
node --loader ts-node/esm lib/queue/worker.ts
```

**Expected Output:**
```
Redis connected successfully
Redis is ready to accept commands
Worker is ready to process jobs
```

### Step 3: Create Model (Will Actually Process)

```bash
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "referenceModelId": 1,
    "name": "Test Model",
    "trainingImages": ["url1", "url2", "url3"]
  }'
```

**Worker will:**
1. Pick up job from queue
2. Call fal.ai API (takes 5-15 min)
3. Update custom_models table
4. Deduct credits
5. Mark job as completed

### Step 4: Poll Job Status

```bash
# Poll every 30 seconds
while true; do
  curl http://localhost:3000/api/generate/JOB_ID -b cookies.txt
  sleep 30
done
```

**Status progression:**
```
queued → processing → completed
```

**Final response:**
```json
{
  "status": "completed",
  "result": {
    "customModelId": 1,
    "modelUrl": "https://storage.fal.ai/files/...",
    "metadata": { ... }
  }
}
```

---

## Testing Image Generation

### 1. Generate Image (Requires completed model)

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "customModelId": 1,
    "prompt": "woman in red dress standing in park",
    "resolution": "1024x1024",
    "quality": "hd",
    "numImages": 1
  }'
```

**Expected:**
```json
{
  "job": {
    "id": "...",
    "type": "image_generation",
    "estimatedCredits": 15.00,
    "status": "queued"
  }
}
```

### 2. Get Generated Image (After completion)

```bash
curl http://localhost:3000/api/generate/JOB_ID -b cookies.txt
```

**Expected (completed):**
```json
{
  "status": "completed",
  "result": {
    "images": [
      {
        "url": "https://presigned-s3-url...",
        "expiresAt": "2026-01-02T00:00:00Z",
        "width": 1024,
        "height": 1024
      }
    ]
  }
}
```

---

## Postman Collection

Import this collection to test easily:

**Base URL:** `http://localhost:3000`

**Endpoints:**
1. `GET /api/reference-models` - List models
2. `POST /api/auth/sign-in` - Login
3. `GET /api/credits/balance` - Check credits
4. `POST /api/models` - Create model
5. `GET /api/generate/:jobId` - Check job status
6. `DELETE /api/jobs/:id` - Cancel job

---

## Quick Test Script

```bash
#!/bin/bash

# 1. Login
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"admin123"}' \
  -c cookies.txt

# 2. Check credits
echo "\n--- Credits ---"
curl http://localhost:3000/api/credits/balance -b cookies.txt

# 3. List reference models
echo "\n--- Reference Models ---"
curl http://localhost:3000/api/reference-models

# 4. Create custom model (without fal.ai, will queue)
echo "\n--- Create Model ---"
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "referenceModelId": 1,
    "name": "Test Model",
    "trainingImages": ["url1", "url2", "url3"]
  }'

# 5. Check jobs
echo "\n--- Jobs ---"
curl http://localhost:3000/api/jobs -b cookies.txt
```

---

## Summary

✅ **APIs Implemented**: 23 endpoints
✅ **Database Ready**: Migrated + Seeded
✅ **Credits System**: Working (reserve/deduct/refund)
✅ **Queue System**: Ready (needs worker + fal.ai key)

**To Test Full Flow:**
1. Add `FAL_KEY` to `.env`
2. Start worker: `node --loader ts-node/esm lib/queue/worker.ts`
3. Create model via API
4. Worker processes job
5. Check result

**Without Worker:**
- APIs work (queue jobs, reserve credits)
- Jobs sit in queue (never process)
- Can test cancel/refund flow
