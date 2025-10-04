import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customModels, referenceModels } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { calculateModelCreationCost } from '@/credits/calculator';
import { reserveCredits } from '@/credits/transactions';
import { createJob } from '@/lib/queue/jobs';
import { JobType, CustomModelStatus } from '@/generation/types';
import { OperationType } from '@/credits/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/models
 * Create a new custom model
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
      referenceModelId,
      name,
      description,
      trainingImages,
      triggerWord,
      trainingSteps,
      loraRank
    } = body;

    // Validate required fields
    if (!referenceModelId || !name || !trainingImages || !Array.isArray(trainingImages) || trainingImages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: referenceModelId, name, trainingImages' },
        { status: 400 }
      );
    }

    // Verify reference model exists
    const [refModel] = await db
      .select()
      .from(referenceModels)
      .where(eq(referenceModels.id, referenceModelId))
      .limit(1);

    if (!refModel) {
      return NextResponse.json(
        { error: 'Reference model not found' },
        { status: 404 }
      );
    }

    // Calculate cost
    const cost = await calculateModelCreationCost({
      referenceModelId,
      trainingImagesCount: trainingImages.length
    });

    // Reserve credits (jobId will be set after job creation)
    const reserved = await reserveCredits({
      teamId: userWithTeam.teamId,
      amount: cost,
      operationType: OperationType.MODEL_CREATION,
      jobId: null as any, // Will be null for reservation, actual jobId added after job creation
      metadata: {
        referenceModelId,
        name,
        trainingImagesCount: trainingImages.length
      }
    });

    if (!reserved) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Create custom model record
    const [customModel] = await db
      .insert(customModels)
      .values({
        teamId: userWithTeam.teamId,
        referenceModelId,
        name,
        description: description || null,
        creationPrompt: description || `Custom model based on ${refModel.name}`,
        status: CustomModelStatus.PENDING,
        version: 1,
        trainingMetadata: {
          triggerWord: triggerWord || name.toLowerCase().replace(/\s+/g, '_'),
          trainingSteps: trainingSteps || 1000,
          loraRank: loraRank || 16,
          trainingImagesCount: trainingImages.length
        }
      })
      .returning();

    // Create job
    const jobId = await createJob({
      teamId: userWithTeam.teamId,
      userId: user.id,
      jobType: JobType.MODEL_CREATION,
      inputData: {
        customModelId: customModel.id,
        trainingImages,
        triggerWord: triggerWord || name.toLowerCase().replace(/\s+/g, '_'),
        trainingSteps: trainingSteps || 1000,
        loraRank: loraRank || 16,
        creditAmount: cost
      },
      estimatedCredits: cost
    });

    return NextResponse.json({
      customModel: {
        id: customModel.id,
        name: customModel.name,
        description: customModel.description,
        status: customModel.status,
        version: customModel.version,
        createdAt: customModel.createdAt
      },
      job: {
        id: jobId,
        type: JobType.MODEL_CREATION,
        estimatedCredits: cost
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create custom model:', error);
    return NextResponse.json(
      { error: 'Failed to create custom model' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models
 * List team's custom models
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db
      .select()
      .from(customModels)
      .where(eq(customModels.teamId, userWithTeam.teamId))
      .$dynamic();

    if (status) {
      query = query.where(eq(customModels.status, status));
    }

    const models = await query
      .orderBy(desc(customModels.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      models: models.map(model => ({
        id: model.id,
        referenceModelId: model.referenceModelId,
        name: model.name,
        description: model.description,
        status: model.status,
        version: model.version,
        modelUrl: model.modelUrl,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      })),
      pagination: {
        limit,
        offset,
        hasMore: models.length === limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch custom models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom models' },
      { status: 500 }
    );
  }
}
