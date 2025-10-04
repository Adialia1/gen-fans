// AI Generation Types

export enum JobType {
  MODEL_CREATION = 'model_creation',
  MODEL_REFINEMENT = 'model_refinement',
  IMAGE_GENERATION = 'image_generation',
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CustomModelStatus {
  PENDING = 'pending',
  TRAINING = 'training',
  REFINING = 'refining',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export interface ModelCreationParams {
  referenceModelId?: number;
  prompt?: string;
  triggerWord?: string;
  trainingImages?: string[]; // S3 URLs
  trainingSteps?: number;
  loraRank?: number;
}

export interface ModelRefinementParams {
  customModelId?: number;
  refinementPrompt?: string;
  additionalImages?: string[];
  triggerWord?: string;
  refinementSteps?: number;
  loraRank?: number;
  baseModelUrl?: string;
  refinementIteration?: number;
}

export interface ImageGenerationParams {
  customModelId?: number;
  prompt: string;
  resolution?: '512x512' | '1024x1024' | '1536x1536';
  quality?: 'normal' | 'hd';
  modelUrl?: string;
  modelStrength?: number;
  numImages?: number;
  inferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

export interface JobResult {
  success?: boolean;
  imageUrl?: string; // S3 URL for image generation
  images?: any[]; // Array of generated images
  modelUrl?: string; // Model file URL
  modelId?: number; // Custom model ID for model creation
  falLoraId?: string; // fal.ai LoRA ID
  metadata?: Record<string, any>;
  error?: JobError;
}

export interface JobError {
  message: string;
  code?: string;
  falError?: any;
}

export interface RefinementHistoryEntry {
  prompt: string;
  timestamp: string;
  jobId: string;
  version: number;
}
