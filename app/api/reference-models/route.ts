import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { referenceModels } from '@/lib/db/schema';
import { eq, desc, and, like } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reference-models
 * List reference models with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'popularity'; // popularity, name, newest
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db.select().from(referenceModels).$dynamic();

    // Apply filters
    const conditions = [];
    if (category) {
      conditions.push(eq(referenceModels.category, category));
    }
    if (search) {
      conditions.push(
        like(referenceModels.name, `%${search}%`)
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        query = query.orderBy(desc(referenceModels.popularityScore));
        break;
      case 'name':
        query = query.orderBy(referenceModels.name);
        break;
      case 'newest':
        query = query.orderBy(desc(referenceModels.createdAt));
        break;
    }

    // Apply pagination
    const models = await query.limit(limit).offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: referenceModels.id })
      .from(referenceModels);

    return NextResponse.json({
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        category: model.category,
        description: model.description,
        previewImages: model.previewImages,
        characteristics: model.characteristics,
        complexityFactor: parseFloat(model.complexityFactor),
        popularityScore: model.popularityScore,
        tags: model.tags,
        createdAt: model.createdAt
      })),
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
  } catch (error) {
    console.error('Failed to fetch reference models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference models' },
      { status: 500 }
    );
  }
}
