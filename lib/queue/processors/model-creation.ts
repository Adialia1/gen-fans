import { Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { customModels, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createModel } from '@/generation/fal-client';
import { deductCredits, refundCredits } from '@/credits/transactions';
import { OperationType } from '@/credits/types';
import { JobStatus, CustomModelStatus } from '@/generation/types';

export interface ModelCreationJobData {
  jobId: string;
  teamId: number;
  userId: number;
  customModelId: number;
  trainingImages: string[];
  triggerWord: string;
  trainingSteps?: number;
  loraRank?: number;
  creditAmount: number;
}

/**
 * Process model creation job
 */
export async function processModelCreation(job: Job<ModelCreationJobData>) {
  const { jobId, teamId, customModelId, trainingImages, triggerWord, trainingSteps, loraRank, creditAmount } = job.data;

  try {
    console.log(`Processing model creation job ${jobId} for team ${teamId}`);

    // Update job status to processing
    await db
      .update(jobs)
      .set({
        status: JobStatus.PROCESSING,
        startedAt: new Date()
      })
      .where(eq(jobs.id, jobId));

    // Update custom model status
    await db
      .update(customModels)
      .set({
        status: CustomModelStatus.TRAINING,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));

    // Call fal.ai to create the model
    job.updateProgress(25);
    const result = await createModel({
      trainingImages,
      triggerWord,
      trainingSteps,
      loraRank
    });

    if (!result.success || !result.modelUrl) {
      throw new Error(result.error?.message || 'Model creation failed');
    }

    job.updateProgress(75);

    // Update custom model with result
    await db
      .update(customModels)
      .set({
        status: CustomModelStatus.READY,
        modelUrl: result.modelUrl,
        trainingMetadata: result.metadata,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));

    // Deduct credits (move from reserved to deducted)
    await deductCredits({
      teamId,
      amount: creditAmount,
      operationType: OperationType.MODEL_CREATION,
      jobId,
      metadata: {
        customModelId,
        modelUrl: result.modelUrl,
        trainingSteps: trainingSteps || 1000
      }
    });

    job.updateProgress(95);

    // Update job status to completed
    await db
      .update(jobs)
      .set({
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        resultData: {
          customModelId,
          modelUrl: result.modelUrl,
          metadata: result.metadata
        }
      })
      .where(eq(jobs.id, jobId));

    job.updateProgress(100);

    console.log(`Model creation job ${jobId} completed successfully`);
    return { success: true, modelUrl: result.modelUrl };
  } catch (error) {
    console.error(`Model creation job ${jobId} failed:`, error);

    // Update custom model status to failed
    await db
      .update(customModels)
      .set({
        status: CustomModelStatus.FAILED,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));

    // Refund credits
    await refundCredits({
      teamId,
      amount: creditAmount,
      jobId,
      reason: `Model creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    // Update job status to failed
    await db
      .update(jobs)
      .set({
        status: JobStatus.FAILED,
        completedAt: new Date(),
        error: {
          code: 'MODEL_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
      .where(eq(jobs.id, jobId));

    throw error;
  }
}
