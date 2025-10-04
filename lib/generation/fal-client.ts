import * as fal from '@fal-ai/serverless-client';
import { createHmac } from 'crypto';
import {
  ModelCreationParams,
  ModelRefinementParams,
  ImageGenerationParams,
  JobResult
} from './types';

// Initialize fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

/**
 * Create a custom AI model from training images
 */
export async function createModel(
  params: ModelCreationParams
): Promise<JobResult> {
  try {
    const result = await fal.subscribe('fal-ai/flux-lora-trainer', {
      input: {
        images_data_url: params.trainingImages,
        trigger_word: params.triggerWord,
        steps: params.trainingSteps || 1000,
        lora_rank: params.loraRank || 16,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      },
    }) as any;

    return {
      success: true,
      modelUrl: result.diffusers_lora_file?.url,
      metadata: {
        triggerWord: params.triggerWord,
        steps: params.trainingSteps || 1000,
        loraRank: params.loraRank || 16,
      }
    };
  } catch (error) {
    console.error('Model creation failed:', error);
    return {
      success: false,
      metadata: {
        error: {
          code: 'MODEL_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      }
    };
  }
}

/**
 * Refine an existing custom model with additional training
 */
export async function refineModel(
  params: ModelRefinementParams
): Promise<JobResult> {
  try {
    const result = await fal.subscribe('fal-ai/flux-lora-trainer', {
      input: {
        images_data_url: params.additionalImages,
        trigger_word: params.triggerWord,
        steps: params.refinementSteps || 500,
        lora_rank: params.loraRank || 16,
        base_lora_url: params.baseModelUrl, // Continue training from existing model
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Refinement queue update:', update);
      },
    }) as any;

    return {
      success: true,
      modelUrl: result.diffusers_lora_file?.url,
      metadata: {
        triggerWord: params.triggerWord,
        steps: params.refinementSteps || 500,
        loraRank: params.loraRank || 16,
        refinementIteration: params.refinementIteration
      }
    };
  } catch (error) {
    console.error('Model refinement failed:', error);
    return {
      success: false,
      metadata: {
        error: {
          code: 'MODEL_REFINEMENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      }
    };
  }
}

/**
 * Generate an image using a custom model
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<JobResult> {
  try {
    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: {
        prompt: params.prompt,
        loras: [
          {
            path: params.modelUrl,
            scale: params.modelStrength || 1.0
          }
        ],
        num_images: params.numImages || 1,
        image_size: params.resolution || '1024x1024',
        num_inference_steps: params.inferenceSteps || 28,
        guidance_scale: params.guidanceScale || 3.5,
        seed: params.seed,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Generation queue update:', update);
      },
    }) as any;

    return {
      success: true,
      images: result.images?.map((img: any) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        contentType: img.content_type
      })) || [],
      metadata: {
        prompt: params.prompt,
        seed: result.seed,
        resolution: params.resolution || '1024x1024',
        inferenceSteps: params.inferenceSteps || 28
      }
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      success: false,
      metadata: {
        error: {
          code: 'IMAGE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        }
      }
    };
  }
}

/**
 * Validate fal.ai webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
}

/**
 * Initialize fal.ai client with custom configuration
 */
export function initialize(config?: { credentials?: string; proxyUrl?: string }) {
  fal.config({
    credentials: config?.credentials || process.env.FAL_KEY,
    proxyUrl: config?.proxyUrl
  });
}
