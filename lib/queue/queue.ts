import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from './redis';
import { JobType } from '@/generation/types';
import { PLAN_PRIORITY } from '@/credits/types';

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // Start with 5 seconds
    },
    removeOnComplete: {
      age: 7 * 24 * 3600, // Keep completed jobs for 7 days
      count: 1000 // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 30 * 24 * 3600 // Keep failed jobs for 30 days
    }
  }
};

// Create the AI jobs queue
export const aiJobsQueue = new Queue('ai-jobs', queueOptions);

// Queue event handlers
aiJobsQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

aiJobsQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

aiJobsQueue.on('active' as any, (job: any) => {
  console.log(`Job ${job.id} is now active`);
});

aiJobsQueue.on('completed' as any, (job: any) => {
  console.log(`Job ${job.id} completed`);
});

aiJobsQueue.on('failed' as any, (job: any, err: any) => {
  console.error(`Job ${job?.id} failed:`, err);
});

/**
 * Add a job to the queue with priority based on plan
 */
export async function addJobToQueue(
  jobId: string,
  jobType: JobType,
  data: any,
  teamPlan: 'free' | 'basic' | 'pro' | 'enterprise' = 'basic'
) {
  const priority = PLAN_PRIORITY[teamPlan];

  const job = await aiJobsQueue.add(
    jobType,
    {
      jobId,
      jobType,
      ...data
    },
    {
      jobId, // Use our DB job ID as the queue job ID
      priority,
      attempts: jobType === JobType.IMAGE_GENERATION ? 2 : 3 // Fewer retries for image gen
    }
  );

  console.log(`Added job ${jobId} to queue with priority ${priority}`);
  return job;
}

/**
 * Get job status from queue
 */
export async function getQueueJobStatus(jobId: string) {
  const job = await aiJobsQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    failedReason,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn
  };
}

/**
 * Cancel a job in the queue
 */
export async function cancelQueueJob(jobId: string): Promise<boolean> {
  try {
    const job = await aiJobsQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    const state = await job.getState();

    // Only cancel if job is waiting or delayed
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      return true;
    }

    // If job is active, we can't cancel it (will fail at processor level)
    return false;
  } catch (error) {
    console.error('Failed to cancel queue job:', error);
    return false;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    aiJobsQueue.getWaitingCount(),
    aiJobsQueue.getActiveCount(),
    aiJobsQueue.getCompletedCount(),
    aiJobsQueue.getFailedCount(),
    aiJobsQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clean up old jobs
 */
export async function cleanupOldJobs() {
  await aiJobsQueue.clean(7 * 24 * 3600 * 1000, 1000, 'completed'); // 7 days
  await aiJobsQueue.clean(30 * 24 * 3600 * 1000, 1000, 'failed'); // 30 days
  console.log('Old jobs cleaned up');
}

/**
 * Pause the queue
 */
export async function pauseQueue() {
  await aiJobsQueue.pause();
  console.log('Queue paused');
}

/**
 * Resume the queue
 */
export async function resumeQueue() {
  await aiJobsQueue.resume();
  console.log('Queue resumed');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue...');
  await aiJobsQueue.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue...');
  await aiJobsQueue.close();
});

export default aiJobsQueue;
