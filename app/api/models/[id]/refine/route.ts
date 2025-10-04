import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customModels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { calculateRefinementCost } from '@/credits/calculator';
import { reserveCredits } from '@/credits/transactions';
import { createJob } from '@/lib/queue/jobs';
import { JobType, CustomModelStatus } from '@/generation/types';
import { OperationType } from '@/credits/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/models/[id]/refine
 * Queue refinement job for a custom model
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    const modelId = parseInt(id);
    if (isNaN(modelId)) {
      return NextResponse.json({ error: 'Invalid model ID' }, { status: 400 });
    }

    const body = await request.json();
    const { additionalImages, refinementSteps, loraRank } = body;

    if (!additionalImages || !Array.isArray(additionalImages) || additionalImages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: additionalImages' },
        { status: 400 }
      );
    }

    // Get custom model
    const [model] = await db
      .select()
      .from(customModels)
      .where(
        and(
          eq(customModels.id, modelId),
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

    // Verify model is ready for refinement
    if (model.status !== CustomModelStatus.READY) {
      return NextResponse.json(
        { error: `Model must be in 'ready' status to refine (current: ${model.status})` },
        { status: 400 }
      );
    }

    if (!model.modelUrl) {
      return NextResponse.json(
        { error: 'Model URL is missing' },
        { status: 400 }
      );
    }

    // Calculate refinement iteration
    const refinementHistory = (model.refinementHistory as any[]) || [];
    const refinementIteration = refinementHistory.length + 1;

    // Get reference model complexity from training metadata
    const trainingMetadata = model.trainingMetadata as any;
    const complexityFactor = trainingMetadata?.complexityFactor || 1.5;

    // Calculate cost
    const cost = await calculateRefinementCost({
      refinementIteration,
      modelComplexityFactor: complexityFactor
    });

    // Reserve credits
    const reserved = await reserveCredits({
      teamId: userWithTeam.teamId,
      amount: cost,
      operationType: OperationType.MODEL_REFINEMENT,
      jobId: 'temp', // Will be replaced after job creation
      metadata: {
        customModelId: model.id,
        refinementIteration,
        additionalImagesCount: additionalImages.length
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
      jobType: JobType.MODEL_REFINEMENT,
      inputData: {
        customModelId: model.id,
        baseModelUrl: model.modelUrl,
        additionalImages,
        triggerWord: trainingMetadata?.triggerWord || model.name.toLowerCase().replace(/\s+/g, '_'),
        refinementSteps: refinementSteps || 500,
        loraRank: loraRank || trainingMetadata?.loraRank || 16,
        refinementIteration,
        creditAmount: cost
      },
      estimatedCredits: cost
    });

    return NextResponse.json({
      job: {
        id: jobId,
        type: JobType.MODEL_REFINEMENT,
        estimatedCredits: cost
      },
      refinement: {
        iteration: refinementIteration,
        additionalImagesCount: additionalImages.length
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create refinement job:', error);
    return NextResponse.json(
      { error: 'Failed to create refinement job' },
      { status: 500 }
    );
  }
}
