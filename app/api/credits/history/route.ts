import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getTransactionHistory } from '@/credits/credit-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/credits/history
 * Get paginated credit transaction history
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await getTransactionHistory(
      userWithTeam.teamId,
      limit,
      offset
    );

    return NextResponse.json({
      transactions,
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch credit history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit history' },
      { status: 500 }
    );
  }
}
