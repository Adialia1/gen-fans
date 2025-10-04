import { Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateImage } from '@/generation/fal-client';
import { saveGeneratedImage } from '@/storage/image-storage';
import { deductCredits, refundCredits } from '@/credits/transactions';
import { OperationType } from '@/credits/types';
import { JobStatus } from '@/generation/types';

export interface ImageGenerationJobData {
  jobId: string;
  teamId: number;
  userId: number;
  customModelId: number;
  modelUrl: string;
  prompt: string;
  resolution: '512x512' | '1024x1024' | '1536x1536';
  quality: 'normal' | 'hd';
  numImages?: number;
  modelStrength?: number;
  inferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  creditAmount: number;
}

/**
 * Process image generation job
 */
export async function processImageGeneration(job: Job<ImageGenerationJobData>) {
  const {
    jobId,
    teamId,
    userId,
    customModelId,
    modelUrl,
    prompt,
    resolution,
    quality,
    numImages,
    modelStrength,
    inferenceSteps,
    guidanceScale,
    seed,
    creditAmount
  } = job.data;

  try {
    console.log(`Processing image generation job ${jobId} for team ${teamId}`);

    // Update job status to processing
    await db
      .update(jobs)
      .set({
        status: JobStatus.PROCESSING,
        startedAt: new Date()
      })
      .where(eq(jobs.id, jobId));

    // Call fal.ai to generate images
    job.updateProgress(25);
    const result = await generateImage({
      modelUrl,
      prompt,
      resolution,
      numImages,
      modelStrength,
      inferenceSteps,
      guidanceScale,
      seed
    });

    if (!result.success || !result.images || result.images.length === 0) {
      throw new Error(result.error?.message || 'Image generation failed');
    }

    job.updateProgress(50);

    // Upload images to S3
    const uploadedImages = [];
    for (let i = 0; i < result.images.length; i++) {
      const image = result.images[i];
      job.updateProgress(50 + (i / result.images.length) * 25);

      const uploadResult = await saveGeneratedImage({
        imageUrl: image.url,
        teamId,
        jobId,
        contentType: image.contentType,
        metadata: {
          width: image.width,
          height: image.height,
          prompt,
          seed: result.metadata?.seed,
          resolution,
          quality
        }
      });

      uploadedImages.push({
        s3Key: uploadResult.s3Key,
        publicUrl: uploadResult.publicUrl,
        expiresAt: uploadResult.expiresAt,
        width: image.width,
        height: image.height
      });
    }

    job.updateProgress(80);

    // Deduct credits
    await deductCredits({
      teamId,
      amount: creditAmount,
      operationType: OperationType.IMAGE_GENERATION,
      jobId,
      metadata: {
        customModelId,
        prompt,
        resolution,
        quality,
        numImages: result.images.length,
        seed: result.metadata?.seed
      }
    });

    job.updateProgress(90);

    // Set expiration date (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Update job status to completed
    await db
      .update(jobs)
      .set({
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        resultData: {
          images: uploadedImages,
          metadata: result.metadata,
          expiresAt: expiresAt.toISOString()
        }
      })
      .where(eq(jobs.id, jobId));

    job.updateProgress(100);

    console.log(`Image generation job ${jobId} completed successfully`);
    return { success: true, images: uploadedImages };
  } catch (error) {
    console.error(`Image generation job ${jobId} failed:`, error);

    // Refund credits
    await refundCredits({
      teamId,
      amount: creditAmount,
      jobId,
      reason: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    // Update job status to failed
    await db
      .update(jobs)
      .set({
        status: JobStatus.FAILED,
        completedAt: new Date(),
        error: {
          code: 'IMAGE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
      .where(eq(jobs.id, jobId));

    throw error;
  }
}
