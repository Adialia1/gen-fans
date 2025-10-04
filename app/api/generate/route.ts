import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customModels, referenceModels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getUserWithTeam, getActiveJobsCount } from '@/lib/db/queries';
import { calculateImageGenerationCost } from '@/credits/calculator';
import { reserveCredits } from '@/credits/transactions';
import { createJob } from '@/lib/queue/jobs';
import { JobType, CustomModelStatus } from '@/generation/types';
import { OperationType, PLAN_CONCURRENCY } from '@/credits/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/generate
 * Queue image generation job
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customModelId,
      prompt,
      resolution = '1024x1024',
      quality = 'normal',
      numImages = 1,
      modelStrength,
      inferenceSteps,
      guidanceScale,
      seed
    } = body;

    // Validate required fields
    if (!customModelId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: customModelId, prompt' },
        { status: 400 }
      );
    }

    // Validate resolution
    const validResolutions = ['512x512', '1024x1024', '1536x1536'];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: `Invalid resolution. Must be one of: ${validResolutions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate quality
    const validQualities = ['normal', 'hd'];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: `Invalid quality. Must be one of: ${validQualities.join(', ')}` },
        { status: 400 }
      );
    }

    // Get custom model
    const [model] = await db
      .select({
        customModel: customModels,
        referenceModel: referenceModels
      })
      .from(customModels)
      .leftJoin(referenceModels, eq(customModels.referenceModelId, referenceModels.id))
      .where(
        and(
          eq(customModels.id, customModelId),
          eq(customModels.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!model) {
      return NextResponse.json(
        { error: 'Custom model not found' },
        { status: 404 }
      );
    }

    // Verify model is ready
    if (model.customModel.status !== CustomModelStatus.READY) {
      return NextResponse.json(
        { error: `Model must be in 'ready' status (current: ${model.customModel.status})` },
        { status: 400 }
      );
    }

    if (!model.customModel.modelUrl) {
      return NextResponse.json(
        { error: 'Model URL is missing' },
        { status: 400 }
      );
    }

    // Check concurrency limits (determine plan from team - simplified for now)
    const activeJobs = await getActiveJobsCount(userWithTeam.teamId);
    const teamPlan = 'basic'; // TODO: Get from team subscription
    const maxConcurrency = PLAN_CONCURRENCY[teamPlan];

    if (activeJobs >= maxConcurrency) {
      return NextResponse.json(
        { error: `Concurrent job limit reached (${maxConcurrency} for ${teamPlan} plan)` },
        { status: 429 }
      );
    }

    // Calculate cost
    const complexityFactor = model.referenceModel
      ? parseFloat(model.referenceModel.complexityFactor)
      : 1.5;

    const cost = await calculateImageGenerationCost({
      resolution: resolution as '512x512' | '1024x1024' | '1536x1536',
      quality: quality as 'normal' | 'hd',
      modelComplexityFactor: complexityFactor,
      numImages
    });

    // Reserve credits
    const reserved = await reserveCredits({
      teamId: userWithTeam.teamId,
      amount: cost,
      operationType: OperationType.IMAGE_GENERATION,
      jobId: 'temp', // Will be replaced after job creation
      metadata: {
        customModelId,
        prompt,
        resolution,
        quality,
        numImages
      }
    });

    if (!reserved) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Create job
    const jobId = await createJob({
      teamId: userWithTeam.teamId,
      userId: user.id,
      jobType: JobType.IMAGE_GENERATION,
      inputData: {
        customModelId,
        modelUrl: model.customModel.modelUrl,
        prompt,
        resolution,
        quality,
        numImages,
        modelStrength,
        inferenceSteps,
        guidanceScale,
        seed,
        creditAmount: cost
      },
      estimatedCredits: cost,
      teamPlan
    });

    return NextResponse.json({
      job: {
        id: jobId,
        type: JobType.IMAGE_GENERATION,
        estimatedCredits: cost,
        status: 'queued'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create image generation job:', error);
    return NextResponse.json(
      { error: 'Failed to create image generation job' },
      { status: 500 }
    );
  }
}
