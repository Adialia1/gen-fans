import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getJobStatus } from '@/lib/queue/jobs';
import { getImageUrl } from '@/storage/image-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generate/[jobId]
 * Get job status and result (presigned S3 URL if completed)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    // Get job status
    const job = await getJobStatus(jobId, userWithTeam.teamId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Base response
    const response: any = {
      id: job.id,
      type: job.jobType,
      status: job.status,
      estimatedCredits: job.estimatedCredits,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };

    // Add queue status if job is active
    if (job.queueStatus) {
      response.queueStatus = job.queueStatus;
    }

    // Add error if job failed
    if (job.error) {
      response.error = job.error;
    }

    // Add result data with presigned URLs if job completed
    if (job.status === 'completed' && job.resultData) {
      const resultData = job.resultData as any;

      // If there are images, generate presigned URLs
      if (resultData.images && Array.isArray(resultData.images)) {
        const imagesWithUrls = await Promise.all(
          resultData.images.map(async (image: any) => {
            try {
              // Check if image is still valid (not expired)
              const expiresAt = new Date(resultData.expiresAt || image.expiresAt);
              const isExpired = expiresAt < new Date();

              if (isExpired) {
                return {
                  ...image,
                  url: null,
                  expired: true
                };
              }

              // Generate presigned URL (valid for 1 hour)
              const presignedUrl = await getImageUrl(image.s3Key, 3600);

              return {
                ...image,
                url: presignedUrl,
                expiresAt: image.expiresAt
              };
            } catch (error) {
              console.error(`Failed to get presigned URL for ${image.s3Key}:`, error);
              return {
                ...image,
                url: null,
                error: 'Failed to generate download URL'
              };
            }
          })
        );

        response.result = {
          images: imagesWithUrls,
          metadata: resultData.metadata,
          expiresAt: resultData.expiresAt
        };
      } else {
        // For model creation/refinement jobs
        response.result = resultData;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
