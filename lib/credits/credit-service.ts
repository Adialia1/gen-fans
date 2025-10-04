import { db } from '@/lib/db/drizzle';
import { creditBalances, creditTransactions, teams } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreditBalance, PLAN_CREDITS } from './types';

/**
 * Get credit balance for a team
 */
export async function getBalance(teamId: number): Promise<CreditBalance | null> {
  try {
    const [balance] = await db
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.teamId, teamId))
      .limit(1);

    if (!balance) {
      return null;
    }

    return {
      teamId: balance.teamId,
      availableCredits: parseFloat(balance.availableCredits),
      reservedCredits: parseFloat(balance.reservedCredits),
      bonusCredits: parseFloat(balance.bonusCredits),
      totalAllocated: parseFloat(balance.totalAllocated),
      usedCredits: parseFloat(balance.totalAllocated) - parseFloat(balance.availableCredits) - parseFloat(balance.reservedCredits),
      nextReplenishmentAt: balance.nextReplenishmentAt || undefined,
      lastReplenishedAt: balance.lastReplenishedAt || undefined
    };
  } catch (error) {
    console.error('Failed to get credit balance:', error);
    throw error;
  }
}

/**
 * Get transaction history for a team
 */
export async function getTransactionHistory(
  teamId: number,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.teamId, teamId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return transactions.map(tx => ({
      id: tx.id,
      transactionType: tx.transactionType,
      amount: parseFloat(tx.amount),
      balanceBefore: parseFloat(tx.balanceBefore),
      balanceAfter: parseFloat(tx.balanceAfter),
      operationType: tx.operationType,
      jobId: tx.jobId,
      metadata: tx.metadata,
      createdAt: tx.createdAt
    }));
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    throw error;
  }
}

/**
 * Check if team can afford an operation
 */
export async function canAfford(teamId: number, amount: number): Promise<boolean> {
  try {
    const balance = await getBalance(teamId);

    if (!balance) {
      return false;
    }

    return balance.availableCredits >= amount;
  } catch (error) {
    console.error('Failed to check if team can afford:', error);
    return false;
  }
}

/**
 * Get detailed credit usage statistics
 */
export async function getCreditStats(teamId: number) {
  try {
    const balance = await getBalance(teamId);

    if (!balance) {
      throw new Error('Credit balance not found');
    }

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.teamId, teamId));

    const totalSpent = transactions
      .filter(tx => tx.transactionType === 'deduction')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalRefunded = transactions
      .filter(tx => tx.transactionType === 'refund')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalBonus = transactions
      .filter(tx => tx.transactionType === 'bonus')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const spentByOperation = transactions
      .filter(tx => tx.transactionType === 'deduction' && tx.operationType)
      .reduce((acc, tx) => {
        const type = tx.operationType!;
        acc[type] = (acc[type] || 0) + parseFloat(tx.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      ...balance,
      totalSpent,
      totalRefunded,
      totalBonus,
      spentByOperation,
      utilizationRate: balance.totalAllocated > 0
        ? ((balance.totalAllocated - balance.availableCredits - balance.reservedCredits) / balance.totalAllocated) * 100
        : 0
    };
  } catch (error) {
    console.error('Failed to get credit stats:', error);
    throw error;
  }
}

/**
 * Replenish team credits based on subscription plan (called monthly via Stripe webhook)
 */
export async function replenishTeamCredits(teamId: number): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Get team's current plan
      const [team] = await tx
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (!team) {
        throw new Error('Team not found');
      }

      // Get current balance
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, teamId))
        .for('update');

      if (!balance) {
        throw new Error('Credit balance not found');
      }

      // Determine plan from team's stripeSubscriptionId or default to free
      // For now, we'll determine based on existing allocation
      let plan: keyof typeof PLAN_CREDITS = 'free';
      const currentAllocated = parseFloat(balance.totalAllocated);

      if (currentAllocated >= 10000) plan = 'enterprise';
      else if (currentAllocated >= 2000) plan = 'pro';
      else if (currentAllocated >= 500) plan = 'basic';

      const newAllocation = PLAN_CREDITS[plan];

      // Calculate next replenishment date (1 month from now)
      const nextReplenishment = new Date();
      nextReplenishment.setMonth(nextReplenishment.getMonth() + 1);

      // Reset credits
      await tx
        .update(creditBalances)
        .set({
          availableCredits: newAllocation.toString(),
          reservedCredits: '0.00',
          bonusCredits: '0.00',
          totalAllocated: newAllocation.toString(),
          lastReplenishedAt: new Date(),
          nextReplenishmentAt: nextReplenishment,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, teamId));

      // Create replenishment transaction
      await tx.insert(creditTransactions).values({
        teamId,
        transactionType: 'replenishment',
        amount: newAllocation.toString(),
        balanceBefore: balance.availableCredits,
        balanceAfter: newAllocation.toString(),
        metadata: {
          plan,
          replenishedAt: new Date().toISOString(),
          previousAllocation: balance.totalAllocated
        }
      });
    });
  } catch (error) {
    console.error('Failed to replenish team credits:', error);
    throw error;
  }
}
