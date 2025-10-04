import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { sql, lt } from 'drizzle-orm';
import { bulkDeleteImages } from './image-storage';

/**
 * Clean up expired images (90 days old)
 * This should be run as a cron job daily
 */
export async function cleanupExpiredImages(): Promise<{
  deleted: number;
  errors: number;
}> {
  console.log('Starting expired images cleanup...');

  try {
    // Find all jobs with images that have expired (expiresAt < now)
    const expiredJobs = await db
      .select({
        id: jobs.id,
        resultData: jobs.resultData
      })
      .from(jobs)
      .where(
        sql`${jobs.resultData}->>'expiresAt' < NOW() AND ${jobs.status} = 'completed'`
      )
      .limit(1000); // Process in batches of 1000

    if (expiredJobs.length === 0) {
      console.log('No expired images found');
      return { deleted: 0, errors: 0 };
    }

    console.log(`Found ${expiredJobs.length} expired images to clean up`);

    // Extract image information
    const imagesToDelete = expiredJobs
      .filter(job => job.resultData && typeof job.resultData === 'object')
      .map(job => ({
        jobId: job.id,
        s3Key: (job.resultData as any).s3Key
      }))
      .filter(img => img.s3Key); // Only include jobs with valid s3Key

    if (imagesToDelete.length === 0) {
      console.log('No valid images to delete');
      return { deleted: 0, errors: 0 };
    }

    // Delete images in bulk
    let deleted = 0;
    let errors = 0;

    for (const image of imagesToDelete) {
      try {
        await bulkDeleteImages([image]);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete image for job ${image.jobId}:`, error);
        errors++;
      }
    }

    console.log(`Cleanup complete: ${deleted} deleted, ${errors} errors`);
    return { deleted, errors };
  } catch (error) {
    console.error('Cleanup process failed:', error);
    throw error;
  }
}

/**
 * Mark jobs as expired without deleting images
 * Useful for marking jobs as expired before S3 lifecycle policy deletes them
 */
export async function markExpiredJobs(): Promise<number> {
  console.log('Marking expired jobs...');

  try {
    const result = await db
      .update(jobs)
      .set({
        status: 'expired',
        completedAt: new Date()
      })
      .where(
        sql`${jobs.resultData}->>'expiresAt' < NOW() AND ${jobs.status} = 'completed'`
      );

    const count = Array.isArray(result) ? result.length : 0;
    console.log(`Marked ${count} jobs as expired`);
    return count;
  } catch (error) {
    console.error('Failed to mark expired jobs:', error);
    throw error;
  }
}

/**
 * Get statistics about storage usage and expiration
 */
export async function getStorageStats(): Promise<{
  totalJobs: number;
  completedJobs: number;
  expiredJobs: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
}> {
  try {
    const [stats] = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`,
        completedJobs: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
        expiredJobs: sql<number>`COUNT(*) FILTER (WHERE status = 'expired')`,
        expiringIn7Days: sql<number>`COUNT(*) FILTER (WHERE ${jobs.resultData}->>'expiresAt' < NOW() + INTERVAL '7 days' AND status = 'completed')`,
        expiringIn30Days: sql<number>`COUNT(*) FILTER (WHERE ${jobs.resultData}->>'expiresAt' < NOW() + INTERVAL '30 days' AND status = 'completed')`
      })
      .from(jobs);

    return stats;
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    throw error;
  }
}

// CLI interface for manual execution
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'cleanup':
      cleanupExpiredImages()
        .then(result => {
          console.log('Cleanup result:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Cleanup failed:', error);
          process.exit(1);
        });
      break;

    case 'mark-expired':
      markExpiredJobs()
        .then(count => {
          console.log(`Marked ${count} jobs as expired`);
          process.exit(0);
        })
        .catch(error => {
          console.error('Mark expired failed:', error);
          process.exit(1);
        });
      break;

    case 'stats':
      getStorageStats()
        .then(stats => {
          console.log('Storage statistics:', stats);
          process.exit(0);
        })
        .catch(error => {
          console.error('Get stats failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage: node cleanup.ts [cleanup|mark-expired|stats]');
      process.exit(1);
  }
}
