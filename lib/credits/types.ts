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
  VIDEO_GENERATION_5SEC = 'video_generation_5sec',
  VIDEO_GENERATION_10SEC = 'video_generation_10sec',
  AI_PROMPT_GENERATION = 'ai_prompt_generation',
}

export interface CreditCostParams {
  operationType: OperationType;
  // For model creation
  referenceModelId?: number;
  trainingImagesCount?: number;
  // For model refinement
  refinementIteration?: number;
  modelComplexityFactor?: number;
  // For image generation
  resolution?: '512x512' | '1024x1024' | '1536x1536';
  quality?: 'normal' | 'hd';
  numImages?: number;
}

export interface CreditBalance {
  teamId: number;
  availableCredits: number;
  reservedCredits: number;
  bonusCredits: number;
  totalAllocated: number;
  usedCredits: number;
  nextReplenishmentAt?: Date;
  lastReplenishmentAt?: Date;
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
  starter: 315,    // 300 images + 3 videos (5sec)
  ultra: 1750,     // 1,000 images + 150 videos (5sec)
};

// Plan-based concurrency limits (removed - we don't limit since fal.ai handles workload)
export const PLAN_CONCURRENCY: Record<string, number> = {
  starter: 50,
  ultra: 50,
};

// Plan-based priority (lower = higher priority)
export const PLAN_PRIORITY: Record<string, number> = {
  starter: 10,  // Standard queue
  ultra: 1,     // Instant processing (highest priority)
};
