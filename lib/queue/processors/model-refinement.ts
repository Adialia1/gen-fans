import { Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { customModels, jobs } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { refineModel } from '@/generation/fal-client';
import { deductCredits, refundCredits } from '@/credits/transactions';
import { OperationType } from '@/credits/types';
import { JobStatus, CustomModelStatus } from '@/generation/types';

export interface ModelRefinementJobData {
  jobId: string;
  teamId: number;
  userId: number;
  customModelId: number;
  baseModelUrl: string;
  additionalImages: string[];
  triggerWord: string;
  refinementSteps?: number;
  loraRank?: number;
  refinementIteration: number;
  creditAmount: number;
}

/**
 * Process model refinement job
 */
export async function processModelRefinement(job: Job<ModelRefinementJobData>) {
  const {
    jobId,
    teamId,
    customModelId,
    baseModelUrl,
    additionalImages,
    triggerWord,
    refinementSteps,
    loraRank,
    refinementIteration,
    creditAmount
  } = job.data;

  try {
    console.log(`Processing model refinement job ${jobId} for team ${teamId}`);

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
        status: CustomModelStatus.REFINING,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));

    // Call fal.ai to refine the model
    job.updateProgress(25);
    const result = await refineModel({
      baseModelUrl,
      additionalImages,
      triggerWord,
      refinementSteps,
      loraRank,
      refinementIteration
    });

    if (!result.success || !result.modelUrl) {
      throw new Error(result.error?.message || 'Model refinement failed');
    }

    job.updateProgress(75);

    // Get current model to update refinement history
    const [currentModel] = await db
      .select()
      .from(customModels)
      .where(eq(customModels.id, customModelId))
      .limit(1);

    if (!currentModel) {
      throw new Error('Custom model not found');
    }

    const refinementHistory = (currentModel.refinementHistory as any[]) || [];
    refinementHistory.push({
      iteration: refinementIteration,
      modelUrl: result.modelUrl,
      metadata: result.metadata,
      refinedAt: new Date().toISOString()
    });

    // Update custom model with new version
    await db
      .update(customModels)
      .set({
        status: CustomModelStatus.READY,
        modelUrl: result.modelUrl,
        version: sql`${customModels.version} + 1`,
        refinementHistory: refinementHistory,
        trainingMetadata: {
          ...currentModel.trainingMetadata,
          lastRefinement: result.metadata
        },
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));

    // Deduct credits
    await deductCredits({
      teamId,
      amount: creditAmount,
      operationType: OperationType.MODEL_REFINEMENT,
      jobId,
      metadata: {
        customModelId,
        iteration: refinementIteration,
        modelUrl: result.modelUrl,
        refinementSteps: refinementSteps || 500
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
          iteration: refinementIteration,
          metadata: result.metadata
        }
      })
      .where(eq(jobs.id, jobId));

    job.updateProgress(100);

    console.log(`Model refinement job ${jobId} completed successfully`);
    return { success: true, modelUrl: result.modelUrl };
  } catch (error) {
    console.error(`Model refinement job ${jobId} failed:`, error);

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
      reason: `Model refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    // Update job status to failed
    await db
      .update(jobs)
      .set({
        status: JobStatus.FAILED,
        completedAt: new Date(),
        error: {
          code: 'MODEL_REFINEMENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
      .where(eq(jobs.id, jobId));

    throw error;
  }
}
