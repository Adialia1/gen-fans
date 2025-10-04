import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customModels, referenceModels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getUserWithTeam } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/models/[id]
 * Get custom model details with refinement history
 */
export async function GET(
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

    // Fetch custom model with reference model details
    const [model] = await db
      .select({
        customModel: customModels,
        referenceModel: referenceModels
      })
      .from(customModels)
      .leftJoin(referenceModels, eq(customModels.referenceModelId, referenceModels.id))
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

    return NextResponse.json({
      id: model.customModel.id,
      referenceModelId: model.customModel.referenceModelId,
      referenceModel: model.referenceModel ? {
        id: model.referenceModel.id,
        name: model.referenceModel.name,
        category: model.referenceModel.category,
        complexityFactor: parseFloat(model.referenceModel.complexityFactor)
      } : null,
      name: model.customModel.name,
      description: model.customModel.description,
      status: model.customModel.status,
      version: model.customModel.version,
      modelUrl: model.customModel.modelUrl,
      trainingMetadata: model.customModel.trainingMetadata,
      refinementHistory: model.customModel.refinementHistory || [],
      createdAt: model.customModel.createdAt,
      updatedAt: model.customModel.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch custom model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom model' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/models/[id]
 * Update custom model metadata (name, description only)
 */
export async function PATCH(
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
    const { name, description } = body;

    if (!name && !description) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Verify model belongs to team
    const [existing] = await db
      .select()
      .from(customModels)
      .where(
        and(
          eq(customModels.id, modelId),
          eq(customModels.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom model not found' },
        { status: 404 }
      );
    }

    // Update model
    const [updated] = await db
      .update(customModels)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        updatedAt: new Date()
      })
      .where(eq(customModels.id, modelId))
      .returning();

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Failed to update custom model:', error);
    return NextResponse.json(
      { error: 'Failed to update custom model' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/models/[id]
 * Soft-delete custom model
 */
export async function DELETE(
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

    // Verify model belongs to team
    const [existing] = await db
      .select()
      .from(customModels)
      .where(
        and(
          eq(customModels.id, modelId),
          eq(customModels.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom model not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(customModels)
      .set({
        deletedAt: new Date()
      })
      .where(eq(customModels.id, modelId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete custom model:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom model' },
      { status: 500 }
    );
  }
}
