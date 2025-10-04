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
      lastReplenishmentAt: balance.lastReplenishmentAt || undefined
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

      // Get or create credit balance
      let [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, teamId))
        .for('update');

      // Create balance if it doesn't exist
      if (!balance) {
        console.log(`Creating initial credit balance for team ${teamId}`);
        const nextReplenishment = new Date();
        nextReplenishment.setMonth(nextReplenishment.getMonth() + 1);

        await tx.insert(creditBalances).values({
          teamId,
          availableCredits: '0.00',
          reservedCredits: '0.00',
          bonusCredits: '0.00',
          totalAllocated: '0.00',
          nextReplenishmentAt: nextReplenishment
        });

        [balance] = await tx
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.teamId, teamId))
          .for('update');
      }

      // Determine credit allocation based on plan name
      let creditsToAllocate = 0;
      const planName = team.planName?.toLowerCase() || '';

      // Map plan names to credit amounts (matching the pricing page)
      if (planName.includes('ultra') || planName.includes('אולטרה')) {
        creditsToAllocate = 1750;
      } else if (planName.includes('starter') || planName.includes('מתחילים')) {
        creditsToAllocate = 315;
      } else {
        creditsToAllocate = 0; // Free plan
      }

      console.log(`Allocating ${creditsToAllocate} credits for team ${teamId} with plan: ${planName}`);

      // Calculate next replenishment date (1 month from now)
      const nextReplenishment = new Date();
      nextReplenishment.setMonth(nextReplenishment.getMonth() + 1);

      // Reset credits
      await tx
        .update(creditBalances)
        .set({
          availableCredits: creditsToAllocate.toString(),
          reservedCredits: '0.00',
          bonusCredits: '0.00',
          totalAllocated: creditsToAllocate.toString(),
          lastReplenishmentAt: new Date(),
          nextReplenishmentAt: nextReplenishment,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, teamId));

      // Create replenishment transaction
      await tx.insert(creditTransactions).values({
        teamId,
        transactionType: 'replenishment',
        amount: creditsToAllocate.toString(),
        balanceBefore: balance?.availableCredits || '0.00',
        balanceAfter: creditsToAllocate.toString(),
        metadata: {
          plan: planName,
          replenishedAt: new Date().toISOString(),
          previousAllocation: balance?.totalAllocated || '0.00'
        }
      });

      console.log(`Successfully allocated ${creditsToAllocate} credits for team ${teamId}`);
    });
  } catch (error) {
    console.error('Failed to replenish team credits:', error);
    throw error;
  }
}
