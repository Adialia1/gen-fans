import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { jobs, creditTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getQueueJobStatus } from '@/lib/queue/queue';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/[id]
 * Get single job with credit transaction details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    // Get job
    const [job] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get related credit transactions
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.jobId, jobId));

    // Get queue status if job is active
    let queueStatus = null;
    if (job.status === 'queued' || job.status === 'processing') {
      queueStatus = await getQueueJobStatus(jobId);
    }

    return NextResponse.json({
      id: job.id,
      teamId: job.teamId,
      userId: job.userId,
      jobType: job.jobType,
      status: job.status,
      inputData: job.inputData,
      resultData: job.resultData,
      error: job.error,
      estimatedCredits: parseFloat(job.estimatedCredits),
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      queueStatus,
      creditTransactions: transactions.map(tx => ({
        id: tx.id,
        transactionType: tx.transactionType,
        amount: parseFloat(tx.amount),
        operationType: tx.operationType,
        metadata: tx.metadata,
        createdAt: tx.createdAt
      }))
    });
  } catch (error) {
    console.error('Failed to fetch job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Cancel queued job (refund credits if not started)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    // Import cancelJob here to avoid circular dependency
    const { cancelJob } = await import('@/lib/queue/jobs');

    const cancelled = await cancelJob(jobId, userWithTeam.teamId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job cannot be cancelled (already processing or completed)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
