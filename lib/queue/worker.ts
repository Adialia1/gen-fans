import { Worker, Job } from 'bullmq';
import { redisConnection } from './redis';
import { JobType } from '@/generation/types';
import { PLAN_CONCURRENCY } from '@/credits/types';
import { processModelCreation } from './processors/model-creation';
import { processModelRefinement } from './processors/model-refinement';
import { processImageGeneration } from './processors/image-generation';
import { getActiveJobsCount } from '@/lib/db/queries';

/**
 * Process a job based on its type
 * Note: We don't enforce concurrency limits here since fal.ai handles the actual AI workload.
 * Our worker just makes API calls and waits for responses, so we can handle many concurrent jobs.
 */
async function processJob(job: Job) {
  console.log(`Processing job ${job.id} of type ${job.name}`);

  // Route to appropriate processor
  switch (job.name) {
    case JobType.MODEL_CREATION:
      return await processModelCreation(job);

    case JobType.MODEL_REFINEMENT:
      return await processModelRefinement(job);

    case JobType.IMAGE_GENERATION:
      return await processImageGeneration(job);

    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}

/**
 * Create and start the worker
 */
export function createWorker() {
  const worker = new Worker('ai-jobs', processJob, {
    connection: redisConnection,
    concurrency: 50, // Process up to 50 jobs concurrently (we're just making API calls to fal.ai)
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000 // per second
    },
    settings: {
      stalledInterval: 60000, // Check for stalled jobs every 60s
      maxStalledCount: 2 // Retry stalled jobs twice
    }
  });

  // Worker event handlers
  worker.on('ready', () => {
    console.log('Worker is ready to process jobs');
  });

  worker.on('active', (job) => {
    console.log(`Worker is processing job ${job.id}`);
  });

  worker.on('completed', (job, result) => {
    console.log(`Worker completed job ${job.id}:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`Worker failed job ${job?.id}:`, error);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down worker...`);
    await worker.close();
    await redisConnection.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return worker;
}

// Start worker if this file is run directly
if (require.main === module) {
  console.log('Starting AI jobs worker...');
  const worker = createWorker();
  console.log('Worker started successfully');
}

export default createWorker;
