# Upstash Redis Setup Guide

Using Upstash Redis instead of local Redis for the BullMQ job queue - no Docker or local installation needed!

## Why Upstash?

✅ **Serverless** - No infrastructure to manage
✅ **Free Tier** - 10,000 commands/day free
✅ **Global** - Low latency worldwide
✅ **TLS Support** - Secure connections (rediss://)
✅ **BullMQ Compatible** - Works perfectly with our queue system

## Setup Steps

### 1. Create Upstash Account
1. Go to https://console.upstash.com
2. Sign up with GitHub, Google, or email
3. Verify your email

### 2. Create Redis Database
1. Click **"Create Database"**
2. Choose a name (e.g., `gen-fans-queue`)
3. Select region closest to your app
4. Choose **"Global"** for better availability (optional)
5. Click **"Create"**

### 3. Get Connection URL
1. On database page, scroll to **"REST API"** section
2. Copy the **UPSTASH_REDIS_REST_URL**
3. OR go to **".env"** tab and copy `REDIS_URL`

Format will be:
```
rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### 4. Add to .env
```bash
REDIS_URL=rediss://default:AbCdEf123456@magical-bee-12345.upstash.io:6379
```

### 5. Test Connection
```bash
# Start the queue worker
node --loader ts-node/esm lib/queue/worker.ts
```

You should see:
```
Redis connected successfully
Redis is ready to accept commands
Worker is ready to process jobs
```

## Configuration

Our Redis client (`lib/queue/redis.ts`) automatically detects Upstash:
- ✅ Enables TLS when URL starts with `rediss://`
- ✅ Sets `maxRetriesPerRequest: null` for BullMQ
- ✅ Configures retry strategy
- ✅ Handles reconnection on errors

## Free Tier Limits

**Upstash Free Tier**:
- 10,000 commands per day
- 256 MB max database size
- TLS support included
- Global replication (optional)

**Our Usage Estimate**:
- ~100 commands per job (queue, process, complete)
- ~100 jobs per day = ~10,000 commands ✅ Fits free tier!

For production with >100 jobs/day:
- Upgrade to **Pay as you go** ($0.20 per 100K commands)
- Or **Pro** plan ($10/month for 1M commands)

## Monitoring

### View Queue Stats
```bash
# In Upstash Console
1. Go to your database
2. Click "Data Browser"
3. Search for keys: bull:ai-jobs:*
```

### View Logs
```bash
# Local logs from worker
node --loader ts-node/esm lib/queue/worker.ts

# Upstash metrics
1. Go to "Metrics" tab
2. View commands/sec, memory usage, etc.
```

## Troubleshooting

### Connection Failed
```bash
Error: getaddrinfo ENOTFOUND *.upstash.io
```
**Fix**: Check REDIS_URL format - must start with `rediss://` (note the double 's')

### Authentication Error
```bash
Error: NOAUTH Authentication required
```
**Fix**: Ensure password is included in URL: `rediss://default:PASSWORD@...`

### TLS Error
```bash
Error: unable to verify the first certificate
```
**Fix**: Connection tries TLS automatically when URL starts with `rediss://`

### Rate Limit
```bash
Error: BUSYGROUP Consumer Group name already exists
```
**Fix**: This is normal - means queue is already initialized

## Local Development vs Production

### Local (.env)
```bash
REDIS_URL=rediss://default:***@dev-queue.upstash.io:6379
```

### Production (.env.production)
```bash
REDIS_URL=rediss://default:***@prod-queue.upstash.io:6379
```

**Best Practice**: Use separate Upstash databases for dev/staging/production

## Alternative: Redis Labs

If you prefer Redis Labs/Redis Enterprise Cloud:
```bash
REDIS_URL=rediss://default:PASSWORD@redis-12345.cloud.redislabs.com:12345
```

Our client supports any Redis-compatible service with TLS.

## Cost Comparison

| Service | Free Tier | Production Cost |
|---------|-----------|-----------------|
| **Upstash** | 10K cmds/day | $0.20/100K cmds |
| **Redis Labs** | 30MB, shared | $5/month starter |
| **AWS ElastiCache** | None | ~$15/month (t4g.micro) |
| **Self-hosted** | Free (infrastructure cost) | Server + maintenance |

**Recommendation**: Start with Upstash free tier, upgrade as needed.

## Next Steps

1. ✅ Create Upstash Redis database
2. ✅ Copy connection URL to `.env`
3. ✅ Start queue worker: `node --loader ts-node/esm lib/queue/worker.ts`
4. ✅ Test job processing by creating a model via API

Your serverless Redis queue is ready! 🚀
