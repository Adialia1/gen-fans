import { uploadImage, getPresignedUrl, deleteImage, imageExists } from './s3-client';
import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SaveGeneratedImageParams {
  imageUrl: string;
  teamId: number;
  jobId: string;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface SaveGeneratedImageResult {
  s3Key: string;
  publicUrl: string;
  expiresAt: Date;
}

/**
 * Save a generated image to S3 and update job record
 */
export async function saveGeneratedImage(
  params: SaveGeneratedImageParams
): Promise<SaveGeneratedImageResult> {
  try {
    // Upload image to S3
    const { s3Key, cloudFrontUrl } = await uploadImage({
      imageUrl: params.imageUrl,
      teamId: params.teamId,
      jobId: params.jobId,
      contentType: params.contentType
    });

    // Set expiration date (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Update job record with S3 information
    await db
      .update(jobs)
      .set({
        resultData: {
          s3Key,
          publicUrl: cloudFrontUrl,
          expiresAt: expiresAt.toISOString(),
          metadata: params.metadata || {}
        }
      })
      .where(eq(jobs.id, params.jobId));

    return {
      s3Key,
      publicUrl: cloudFrontUrl,
      expiresAt
    };
  } catch (error) {
    console.error('Failed to save generated image:', error);
    throw new Error(
      `Failed to save generated image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a publicly accessible URL for an image
 * Returns CloudFront URL if available, otherwise generates presigned S3 URL
 */
export async function getImageUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    // Check if image exists
    const exists = await imageExists(s3Key);
    if (!exists) {
      throw new Error('Image not found');
    }

    // Return CloudFront URL if configured
    if (process.env.CLOUDFRONT_DOMAIN) {
      return `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;
    }

    // Otherwise generate presigned S3 URL
    return await getPresignedUrl(s3Key, expiresIn);
  } catch (error) {
    console.error('Failed to get image URL:', error);
    throw new Error(
      `Failed to get image URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete an expired image and clean up job record
 */
export async function deleteExpiredImage(jobId: string, s3Key: string): Promise<void> {
  try {
    // Delete from S3
    await deleteImage(s3Key);

    // Update job status to expired
    await db
      .update(jobs)
      .set({
        status: 'expired',
        completedAt: new Date()
      })
      .where(eq(jobs.id, jobId));
  } catch (error) {
    console.error('Failed to delete expired image:', error);
    throw new Error(
      `Failed to delete expired image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Bulk delete multiple images
 */
export async function bulkDeleteImages(images: Array<{ jobId: string; s3Key: string }>): Promise<void> {
  const errors: Error[] = [];

  for (const image of images) {
    try {
      await deleteExpiredImage(image.jobId, image.s3Key);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  if (errors.length > 0) {
    console.error(`Failed to delete ${errors.length} images:`, errors);
    throw new Error(`Failed to delete ${errors.length} images`);
  }
}
