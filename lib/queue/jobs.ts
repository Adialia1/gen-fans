import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { JobType, JobStatus } from '@/generation/types';
import { addJobToQueue, cancelQueueJob, getQueueJobStatus } from './queue';
import { refundCredits } from '@/credits/transactions';

export interface CreateJobParams {
  teamId: number;
  userId: number;
  jobType: JobType;
  inputData: any;
  estimatedCredits: number;
  teamPlan?: 'free' | 'basic' | 'pro' | 'enterprise';
}

/**
 * Create a new job and add it to the queue
 */
export async function createJob(params: CreateJobParams): Promise<string> {
  try {
    // Create job record in database
    const [job] = await db
      .insert(jobs)
      .values({
        teamId: params.teamId,
        userId: params.userId,
        jobType: params.jobType,
        status: JobStatus.QUEUED,
        inputData: params.inputData,
        estimatedCredits: params.estimatedCredits.toString(),
        queuedAt: new Date()
      })
      .returning();

    if (!job) {
      throw new Error('Failed to create job record');
    }

    // Add job to BullMQ queue
    await addJobToQueue(
      job.id,
      params.jobType,
      {
        ...params.inputData,
        teamId: params.teamId,
        userId: params.userId
      },
      params.teamPlan
    );

    console.log(`Created job ${job.id} of type ${params.jobType}`);
    return job.id;
  } catch (error) {
    console.error('Failed to create job:', error);
    throw error;
  }
}

/**
 * Get job status from database
 */
export async function getJobStatus(jobId: string, teamId: number) {
  try {
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.teamId, teamId)))
      .limit(1);

    if (!job) {
      return null;
    }

    // Get queue status if job is still in queue
    let queueStatus = null;
    if (job.status === JobStatus.QUEUED || job.status === JobStatus.PROCESSING) {
      queueStatus = await getQueueJobStatus(jobId);
    }

    return {
      id: job.id,
      teamId: job.teamId,
      userId: job.userId,
      jobType: job.jobType,
      status: job.status,
      inputData: job.inputData,
      resultData: job.resultData,
      error: job.error,
      estimatedCredits: parseFloat(job.estimatedCredits),
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      queueStatus
    };
  } catch (error) {
    console.error('Failed to get job status:', error);
    throw error;
  }
}

/**
 * Cancel a queued job
 */
export async function cancelJob(jobId: string, teamId: number): Promise<boolean> {
  try {
    // Get job from database
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.teamId, teamId)))
      .limit(1);

    if (!job) {
      throw new Error('Job not found');
    }

    // Only cancel if job is queued (not yet processing)
    if (job.status !== JobStatus.QUEUED) {
      return false;
    }

    // Try to cancel in queue
    const cancelled = await cancelQueueJob(jobId);

    if (cancelled) {
      // Update job status
      await db
        .update(jobs)
        .set({
          status: JobStatus.CANCELLED,
          completedAt: new Date(),
          error: {
            code: 'JOB_CANCELLED',
            message: 'Job was cancelled by user',
            timestamp: new Date().toISOString()
          }
        })
        .where(eq(jobs.id, jobId));

      // Refund reserved credits
      const estimatedCredits = parseFloat(job.estimatedCredits);
      if (estimatedCredits > 0) {
        await refundCredits({
          teamId,
          amount: estimatedCredits,
          jobId,
          reason: 'Job cancelled by user'
        });
      }

      console.log(`Job ${jobId} cancelled successfully`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to cancel job:', error);
    throw error;
  }
}

/**
 * Update job progress (called by processors)
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string
): Promise<void> {
  try {
    await db
      .update(jobs)
      .set({
        inputData: {
          progress,
          progressMessage: message
        }
      })
      .where(eq(jobs.id, jobId));
  } catch (error) {
    console.error('Failed to update job progress:', error);
    throw error;
  }
}

/**
 * Get all jobs for a team with filtering
 */
export async function getTeamJobs(
  teamId: number,
  filters?: {
    status?: JobStatus;
    jobType?: JobType;
    limit?: number;
    offset?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(jobs)
      .where(eq(jobs.teamId, teamId))
      .$dynamic();

    if (filters?.status) {
      query = query.where(eq(jobs.status, filters.status));
    }

    if (filters?.jobType) {
      query = query.where(eq(jobs.jobType, filters.jobType));
    }

    const allJobs = await query
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return allJobs.map(job => ({
      id: job.id,
      teamId: job.teamId,
      userId: job.userId,
      jobType: job.jobType,
      status: job.status,
      estimatedCredits: parseFloat(job.estimatedCredits),
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      hasResult: !!job.resultData,
      hasError: !!job.error
    }));
  } catch (error) {
    console.error('Failed to get team jobs:', error);
    throw error;
  }
}
