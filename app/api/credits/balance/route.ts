import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getBalance } from '@/lib/credits/credit-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/credits/balance
 * Get current credit balance
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

    const balance = await getBalance(userWithTeam.teamId);

    if (!balance) {
      return NextResponse.json(
        { error: 'Credit balance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teamId: balance.teamId,
      availableCredits: balance.availableCredits,
      reservedCredits: balance.reservedCredits,
      bonusCredits: balance.bonusCredits,
      totalAllocated: balance.totalAllocated,
      usedCredits: balance.usedCredits,
      nextReplenishmentAt: balance.nextReplenishmentAt,
      lastReplenishmentAt: balance.lastReplenishmentAt
    });
  } catch (error) {
    console.error('Failed to fetch credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
}
