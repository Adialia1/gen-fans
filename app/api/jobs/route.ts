import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getTeamJobs } from '@/lib/queue/jobs';
import { JobType, JobStatus } from '@/generation/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs
 * List team's jobs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as JobStatus | null;
    const jobType = searchParams.get('jobType') as JobType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate status
    if (status && !['queued', 'processing', 'completed', 'failed', 'cancelled', 'expired'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    // Validate job type
    if (jobType && !['model_creation', 'model_refinement', 'image_generation'].includes(jobType)) {
      return NextResponse.json(
        { error: 'Invalid jobType filter' },
        { status: 400 }
      );
    }

    const jobs = await getTeamJobs(userWithTeam.teamId, {
      status: status || undefined,
      jobType: jobType || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      jobs,
      pagination: {
        limit,
        offset,
        hasMore: jobs.length === limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
