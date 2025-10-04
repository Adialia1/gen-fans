import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

export interface UploadImageParams {
  imageUrl: string;
  teamId: number;
  jobId: string;
  contentType?: string;
}

export interface UploadImageResult {
  s3Key: string;
  s3Url: string;
  cloudFrontUrl: string;
}

/**
 * Upload an image to S3 from a URL
 */
export async function uploadImage(
  params: UploadImageParams
): Promise<UploadImageResult> {
  try {
    // Fetch image from URL
    const response = await fetch(params.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = params.contentType || response.headers.get('content-type') || 'image/png';

    // Generate unique S3 key
    const fileExtension = contentType.split('/')[1] || 'png';
    const fileName = `${randomUUID()}.${fileExtension}`;
    const s3Key = `teams/${params.teamId}/jobs/${params.jobId}/${fileName}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: contentType,
        Metadata: {
          teamId: params.teamId.toString(),
          jobId: params.jobId,
          uploadedAt: new Date().toISOString()
        }
      })
    );

    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const cloudFrontUrl = process.env.CLOUDFRONT_DOMAIN
      ? `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`
      : s3Url;

    return {
      s3Key,
      s3Url,
      cloudFrontUrl
    };
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw new Error(
      `Failed to upload image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a presigned URL for temporary access to an S3 object
 */
export async function getPresignedUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });

    // Verify object exists
    await s3Client.send(command);

    // Generate presigned URL
    const getCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn
    });

    return presignedUrl;
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    throw new Error(
      `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete an image from S3
 */
export async function deleteImage(s3Key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      })
    );
  } catch (error) {
    console.error('S3 deletion failed:', error);
    throw new Error(
      `Failed to delete image from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if an object exists in S3
 */
export async function imageExists(s3Key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}
