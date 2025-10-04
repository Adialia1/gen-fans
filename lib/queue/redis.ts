import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection for BullMQ (supports Upstash with TLS)
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  // Enable TLS for Upstash (rediss://) connections
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  }
});

// Redis event handlers
redisConnection.on('connect', () => {
  console.log('Redis connected successfully');
});

redisConnection.on('ready', () => {
  console.log('Redis is ready to accept commands');
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.on('close', () => {
  console.log('Redis connection closed');
});

redisConnection.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  await redisConnection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  await redisConnection.quit();
  process.exit(0);
});

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redisConnection.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Get Redis info
export async function getRedisInfo(): Promise<string> {
  try {
    return await redisConnection.info();
  } catch (error) {
    console.error('Failed to get Redis info:', error);
    throw error;
  }
}

export default redisConnection;
