import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { referenceModels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reference-models/[id]
 * Get a single reference model by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelId = parseInt(id);

    if (isNaN(modelId)) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const [model] = await db
      .select()
      .from(referenceModels)
      .where(eq(referenceModels.id, modelId))
      .limit(1);

    if (!model) {
      return NextResponse.json(
        { error: 'Reference model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: model.id,
      name: model.name,
      category: model.category,
      description: model.description,
      previewImages: model.previewImages,
      characteristics: model.characteristics,
      complexityFactor: parseFloat(model.complexityFactor),
      popularityScore: model.popularityScore,
      tags: model.tags,
      usageCount: model.usageCount,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch reference model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference model' },
      { status: 500 }
    );
  }
}
