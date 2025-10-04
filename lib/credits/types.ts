// Credit Management Types

export enum CreditTransactionType {
  RESERVATION = 'reservation',
  DEDUCTION = 'deduction',
  REFUND = 'refund',
  REPLENISHMENT = 'replenishment',
  BONUS = 'bonus',
}

export enum OperationType {
  MODEL_CREATION = 'model_creation',
  MODEL_REFINEMENT = 'model_refinement',
  IMAGE_GENERATION = 'image_generation',
}

export interface CreditCostParams {
  operationType: OperationType;
  referenceComplexity?: number; // For model creation
  refinementIteration?: number; // For model refinement
  resolution?: '512x512' | '1024x1024' | '1536x1536'; // For image generation
  quality?: 'normal' | 'hd'; // For image generation
  modelComplexity?: number; // For image generation
}

export interface CreditBalance {
  teamId: number;
  availableCredits: number;
  reservedCredits: number;
  bonusCredits: number;
  totalAllocated: number;
  usedCredits: number;
  nextReplenishmentAt?: Date;
  lastReplenishedAt?: Date;
}

export interface PricingMultipliers {
  referenceComplexity?: number;
  trainingImagesMultiplier?: number;
  refinementIterationMultiplier?: number;
  resolutionMultiplier?: Record<string, number>;
  qualityMultiplier?: Record<string, number>;
  modelComplexityMultiplier?: number;
}

export interface PricingConfig {
  operationType: OperationType;
  baseCost: number;
  multipliers: PricingMultipliers;
}

// Plan-based credit allocations
export const PLAN_CREDITS: Record<string, number> = {
  free: 0,
  basic: 500,
  pro: 2000,
  enterprise: 10000,
};

// Plan-based concurrency limits
export const PLAN_CONCURRENCY: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 3,
  enterprise: 10,
};

// Plan-based priority (lower = higher priority)
export const PLAN_PRIORITY: Record<string, number> = {
  free: 10,
  basic: 10,
  pro: 5,
  enterprise: 1,
};
