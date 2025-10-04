import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs, customModels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateWebhookSignature } from '@/generation/fal-client';
import { saveGeneratedImage } from '@/storage/image-storage';
import { deductCredits } from '@/credits/transactions';
import { JobStatus, CustomModelStatus } from '@/generation/types';
import { OperationType } from '@/credits/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/fal
 * Handle fal.ai webhook callbacks
 */
export async function POST(request: NextRequest) {
  try {
    // Validate webhook signature
    const signature = request.headers.get('x-fal-signature');
    const body = await request.text();

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('FAL_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const isValid = validateWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { jobId, status, result, error } = payload;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId in webhook payload' },
        { status: 400 }
      );
    }

    // Get job from database
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Process webhook based on status
    switch (status) {
      case 'completed':
        await handleCompletedJob(job, result);
        break;

      case 'failed':
        await handleFailedJob(job, error);
        break;

      case 'processing':
        // Update job status
        await db
          .update(jobs)
          .set({
            status: JobStatus.PROCESSING,
            startedAt: job.startedAt || new Date()
          })
          .where(eq(jobs.id, jobId));
        break;

      default:
        console.warn(`Unknown webhook status: ${status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle completed job webhook
 */
async function handleCompletedJob(job: any, result: any) {
  const inputData = job.inputData as any;

  switch (job.jobType) {
    case 'model_creation':
      await handleModelCreationComplete(job, result, inputData);
      break;

    case 'model_refinement':
      await handleModelRefinementComplete(job, result, inputData);
      break;

    case 'image_generation':
      await handleImageGenerationComplete(job, result, inputData);
      break;

    default:
      console.warn(`Unknown job type: ${job.jobType}`);
  }
}

/**
 * Handle model creation completion
 */
async function handleModelCreationComplete(job: any, result: any, inputData: any) {
  const { customModelId, creditAmount } = inputData;

  // Update custom model
  await db
    .update(customModels)
    .set({
      status: CustomModelStatus.READY,
      modelUrl: result.modelUrl,
      trainingMetadata: result.metadata,
      updatedAt: new Date()
    })
    .where(eq(customModels.id, customModelId));

  // Deduct credits
  await deductCredits({
    teamId: job.teamId,
    amount: creditAmount,
    operationType: OperationType.MODEL_CREATION,
    jobId: job.id,
    metadata: {
      customModelId,
      modelUrl: result.modelUrl
    }
  });

  // Update job
  await db
    .update(jobs)
    .set({
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      resultData: result
    })
    .where(eq(jobs.id, job.id));
}

/**
 * Handle model refinement completion
 */
async function handleModelRefinementComplete(job: any, result: any, inputData: any) {
  const { customModelId, refinementIteration, creditAmount } = inputData;

  // Get current model
  const [model] = await db
    .select()
    .from(customModels)
    .where(eq(customModels.id, customModelId))
    .limit(1);

  if (model) {
    const refinementHistory = (model.refinementHistory as any[]) || [];
    refinementHistory.push({
      iteration: refinementIteration,
      modelUrl: result.modelUrl,
      metadata: result.metadata,
      refinedAt: new Date().toISOString()
    });

    // Update custom model
    await db
      .update(customModels)
      .set({
        status: CustomModelStatus.READY,
        modelUrl: result.modelUrl,
        version: model.version + 1,
        refinementHistory,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, customModelId));
  }

  // Deduct credits
  await deductCredits({
    teamId: job.teamId,
    amount: creditAmount,
    operationType: OperationType.MODEL_REFINEMENT,
    jobId: job.id,
    metadata: {
      customModelId,
      iteration: refinementIteration,
      modelUrl: result.modelUrl
    }
  });

  // Update job
  await db
    .update(jobs)
    .set({
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      resultData: result
    })
    .where(eq(jobs.id, job.id));
}

/**
 * Handle image generation completion
 */
async function handleImageGenerationComplete(job: any, result: any, inputData: any) {
  const { customModelId, creditAmount } = inputData;

  // Upload images to S3
  const uploadedImages = [];
  for (const image of result.images || []) {
    const uploadResult = await saveGeneratedImage({
      imageUrl: image.url,
      teamId: job.teamId,
      jobId: job.id,
      contentType: image.contentType,
      metadata: {
        width: image.width,
        height: image.height,
        prompt: inputData.prompt
      }
    });

    uploadedImages.push(uploadResult);
  }

  // Deduct credits
  await deductCredits({
    teamId: job.teamId,
    amount: creditAmount,
    operationType: OperationType.IMAGE_GENERATION,
    jobId: job.id,
    metadata: {
      customModelId,
      imagesGenerated: uploadedImages.length
    }
  });

  // Set expiration (90 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  // Update job
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
    .where(eq(jobs.id, job.id));
}

/**
 * Handle failed job webhook
 */
async function handleFailedJob(job: any, error: any) {
  const inputData = job.inputData as any;

  // Update custom model if applicable
  if (job.jobType === 'model_creation' || job.jobType === 'model_refinement') {
    const customModelId = inputData.customModelId;
    if (customModelId) {
      await db
        .update(customModels)
        .set({
          status: CustomModelStatus.FAILED,
          updatedAt: new Date()
        })
        .where(eq(customModels.id, customModelId));
    }
  }

  // Refund credits
  const { refundCredits } = await import('@/credits/transactions');
  await refundCredits({
    teamId: job.teamId,
    amount: inputData.creditAmount || parseFloat(job.estimatedCredits),
    jobId: job.id,
    reason: `Job failed: ${error?.message || 'Unknown error'}`
  });

  // Update job
  await db
    .update(jobs)
    .set({
      status: JobStatus.FAILED,
      completedAt: new Date(),
      error: {
        code: error?.code || 'UNKNOWN_ERROR',
        message: error?.message || 'Job failed',
        timestamp: new Date().toISOString()
      }
    })
    .where(eq(jobs.id, job.id));
}
