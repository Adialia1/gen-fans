import { NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { replenishTeamCredits } from '@/lib/credits/credit-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/credits/allocate
 * Manually trigger credit allocation for current user's team
 * (Temporary endpoint for testing/fixing credit allocation)
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User is not part of a team' }, { status: 403 });
    }

    await replenishTeamCredits(userWithTeam.teamId);

    return NextResponse.json({
      success: true,
      message: 'Credits allocated successfully',
      teamId: userWithTeam.teamId
    });
  } catch (error) {
    console.error('Failed to allocate credits:', error);
    return NextResponse.json(
      { error: 'Failed to allocate credits', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
