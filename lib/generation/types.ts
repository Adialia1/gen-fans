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
}

export enum CustomModelStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export interface ModelCreationParams {
  referenceModelId: number;
  prompt: string;
  triggerWord: string;
  trainingImages?: string[]; // S3 URLs
}

export interface ModelRefinementParams {
  customModelId: number;
  refinementPrompt: string;
}

export interface ImageGenerationParams {
  customModelId: number;
  prompt: string;
  resolution?: '512x512' | '1024x1024' | '1536x1536';
  quality?: 'normal' | 'hd';
}

export interface JobResult {
  imageUrl?: string; // S3 URL for image generation
  modelId?: number; // Custom model ID for model creation
  falLoraId?: string; // fal.ai LoRA ID
  metadata?: Record<string, any>;
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
