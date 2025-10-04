import { db } from '@/lib/db/drizzle';
import { creditPricingConfig, referenceModels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CreditCostParams, OperationType } from './types';

/**
 * Calculate cost for creating a custom model
 */
export async function calculateModelCreationCost(params: {
  referenceModelId: number;
  trainingImagesCount: number;
}): Promise<number> {
  try {
    // Get pricing config
    const [pricing] = await db
      .select()
      .from(creditPricingConfig)
      .where(eq(creditPricingConfig.operationType, OperationType.MODEL_CREATION))
      .limit(1);

    if (!pricing) {
      throw new Error('Model creation pricing not configured');
    }

    // Get reference model complexity
    const [refModel] = await db
      .select()
      .from(referenceModels)
      .where(eq(referenceModels.id, params.referenceModelId))
      .limit(1);

    if (!refModel) {
      throw new Error('Reference model not found');
    }

    const baseCost = parseFloat(pricing.baseCost);
    const multipliers = pricing.multipliers as any;

    // Formula: baseCost * referenceComplexity + (additionalImages * trainingImagesMultiplier)
    const complexityMultiplier = multipliers.referenceComplexity || 1.5;
    const imageMultiplier = multipliers.trainingImagesMultiplier || 0.5;
    const complexityFactor = parseFloat(refModel.complexityFactor);

    const additionalImages = Math.max(0, params.trainingImagesCount - 5); // First 5 images included
    const cost = baseCost * complexityFactor * complexityMultiplier + (additionalImages * imageMultiplier);

    return Math.ceil(cost * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error('Failed to calculate model creation cost:', error);
    throw error;
  }
}

/**
 * Calculate cost for refining a custom model
 */
export async function calculateRefinementCost(params: {
  refinementIteration: number;
  modelComplexityFactor: number;
}): Promise<number> {
  try {
    // Get pricing config
    const [pricing] = await db
      .select()
      .from(creditPricingConfig)
      .where(eq(creditPricingConfig.operationType, OperationType.MODEL_REFINEMENT))
      .limit(1);

    if (!pricing) {
      throw new Error('Model refinement pricing not configured');
    }

    const baseCost = parseFloat(pricing.baseCost);
    const multipliers = pricing.multipliers as any;

    // Formula: baseCost * (refinementIterationMultiplier ^ iteration) * modelComplexityMultiplier
    const iterationMultiplier = multipliers.refinementIterationMultiplier || 1.2;
    const complexityMultiplier = multipliers.modelComplexityMultiplier || 1.1;

    const iterationCost = Math.pow(iterationMultiplier, params.refinementIteration);
    const cost = baseCost * iterationCost * (params.modelComplexityFactor * complexityMultiplier);

    return Math.ceil(cost * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error('Failed to calculate refinement cost:', error);
    throw error;
  }
}

/**
 * Calculate cost for generating an image
 */
export async function calculateImageGenerationCost(params: {
  resolution: '512x512' | '1024x1024' | '1536x1536';
  quality: 'normal' | 'hd';
  modelComplexityFactor: number;
  numImages?: number;
}): Promise<number> {
  try {
    // Get pricing config
    const [pricing] = await db
      .select()
      .from(creditPricingConfig)
      .where(eq(creditPricingConfig.operationType, OperationType.IMAGE_GENERATION))
      .limit(1);

    if (!pricing) {
      throw new Error('Image generation pricing not configured');
    }

    const baseCost = parseFloat(pricing.baseCost);
    const multipliers = pricing.multipliers as any;

    // Get multipliers
    const resolutionMultiplier = multipliers.resolutionMultiplier?.[params.resolution] || 1.0;
    const qualityMultiplier = multipliers.qualityMultiplier?.[params.quality] || 1.0;
    const complexityMultiplier = multipliers.modelComplexityMultiplier || 1.2;

    // Formula: baseCost * resolutionMultiplier * qualityMultiplier * (modelComplexity * complexityMultiplier) * numImages
    const numImages = params.numImages || 1;
    const cost = baseCost * resolutionMultiplier * qualityMultiplier * (params.modelComplexityFactor * complexityMultiplier) * numImages;

    return Math.ceil(cost * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error('Failed to calculate image generation cost:', error);
    throw error;
  }
}

/**
 * Generic cost calculator that routes to specific calculators
 */
export async function calculateCost(
  operationType: OperationType,
  params: CreditCostParams
): Promise<number> {
  switch (operationType) {
    case OperationType.MODEL_CREATION:
      if (!('referenceModelId' in params) || !('trainingImagesCount' in params)) {
        throw new Error('Invalid params for model creation cost calculation');
      }
      return calculateModelCreationCost({
        referenceModelId: params.referenceModelId,
        trainingImagesCount: params.trainingImagesCount
      });

    case OperationType.MODEL_REFINEMENT:
      if (!('refinementIteration' in params) || !('modelComplexityFactor' in params)) {
        throw new Error('Invalid params for refinement cost calculation');
      }
      return calculateRefinementCost({
        refinementIteration: params.refinementIteration,
        modelComplexityFactor: params.modelComplexityFactor
      });

    case OperationType.IMAGE_GENERATION:
      if (!('resolution' in params) || !('quality' in params) || !('modelComplexityFactor' in params)) {
        throw new Error('Invalid params for image generation cost calculation');
      }
      return calculateImageGenerationCost({
        resolution: params.resolution as '512x512' | '1024x1024' | '1536x1536',
        quality: params.quality as 'normal' | 'hd',
        modelComplexityFactor: params.modelComplexityFactor,
        numImages: 'numImages' in params ? params.numImages : 1
      });

    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}
