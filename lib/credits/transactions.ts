import { db } from '@/lib/db/drizzle';
import { creditBalances, creditTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { CreditTransactionType, OperationType } from './types';

export interface ReserveCreditsParams {
  teamId: number;
  amount: number;
  operationType: OperationType;
  jobId: string | null;
  metadata?: Record<string, any>;
}

export interface DeductCreditsParams {
  teamId: number;
  amount: number;
  operationType: OperationType;
  jobId: string;
  metadata?: Record<string, any>;
}

export interface RefundCreditsParams {
  teamId: number;
  amount: number;
  jobId: string;
  reason?: string;
}

/**
 * Reserve credits for a job (atomic operation with row-level locking)
 */
export async function reserveCredits(params: ReserveCreditsParams): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // Lock the credit balance row for update
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, params.teamId))
        .for('update'); // Row-level lock

      if (!balance) {
        throw new Error('Credit balance not found for team');
      }

      const available = parseFloat(balance.availableCredits);
      const reserved = parseFloat(balance.reservedCredits);

      // Check if enough credits available
      if (available < params.amount) {
        return false; // Not enough credits
      }

      // Update balances: move from available to reserved
      await tx
        .update(creditBalances)
        .set({
          availableCredits: sql`${creditBalances.availableCredits} - ${params.amount}`,
          reservedCredits: sql`${creditBalances.reservedCredits} + ${params.amount}`,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, params.teamId));

      // Create transaction record
      await tx.insert(creditTransactions).values({
        teamId: params.teamId,
        jobId: params.jobId,
        transactionType: CreditTransactionType.RESERVATION,
        amount: params.amount.toString(),
        balanceBefore: available.toString(),
        balanceAfter: (available - params.amount).toString(),
        operationType: params.operationType,
        metadata: params.metadata || {}
      });

      return true;
    });
  } catch (error) {
    console.error('Failed to reserve credits:', error);
    throw error;
  }
}

/**
 * Deduct credits after job completion (convert reservation to deduction)
 */
export async function deductCredits(params: DeductCreditsParams): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Lock the credit balance row
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, params.teamId))
        .for('update');

      if (!balance) {
        throw new Error('Credit balance not found for team');
      }

      const reserved = parseFloat(balance.reservedCredits);

      // Update balances: move from reserved (already deducted from available)
      await tx
        .update(creditBalances)
        .set({
          reservedCredits: sql`${creditBalances.reservedCredits} - ${params.amount}`,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, params.teamId));

      // Create deduction transaction record
      await tx.insert(creditTransactions).values({
        teamId: params.teamId,
        jobId: params.jobId,
        transactionType: CreditTransactionType.DEDUCTION,
        amount: params.amount.toString(),
        balanceBefore: reserved.toString(),
        balanceAfter: (reserved - params.amount).toString(),
        operationType: params.operationType,
        metadata: params.metadata || {}
      });
    });
  } catch (error) {
    console.error('Failed to deduct credits:', error);
    throw error;
  }
}

/**
 * Refund credits (return reserved credits to available)
 */
export async function refundCredits(params: RefundCreditsParams): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Lock the credit balance row
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, params.teamId))
        .for('update');

      if (!balance) {
        throw new Error('Credit balance not found for team');
      }

      const available = parseFloat(balance.availableCredits);
      const reserved = parseFloat(balance.reservedCredits);

      // Update balances: move from reserved back to available
      await tx
        .update(creditBalances)
        .set({
          availableCredits: sql`${creditBalances.availableCredits} + ${params.amount}`,
          reservedCredits: sql`${creditBalances.reservedCredits} - ${params.amount}`,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, params.teamId));

      // Create refund transaction record
      await tx.insert(creditTransactions).values({
        teamId: params.teamId,
        jobId: params.jobId,
        transactionType: CreditTransactionType.REFUND,
        amount: params.amount.toString(),
        balanceBefore: available.toString(),
        balanceAfter: (available + params.amount).toString(),
        metadata: {
          reason: params.reason || 'Job cancelled or failed',
          refundedAt: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Failed to refund credits:', error);
    throw error;
  }
}

/**
 * Add bonus credits to a team
 */
export async function addBonusCredits(
  teamId: number,
  amount: number,
  reason: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Lock the credit balance row
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, teamId))
        .for('update');

      if (!balance) {
        throw new Error('Credit balance not found for team');
      }

      const available = parseFloat(balance.availableCredits);
      const bonus = parseFloat(balance.bonusCredits);

      // Update balances
      await tx
        .update(creditBalances)
        .set({
          availableCredits: sql`${creditBalances.availableCredits} + ${amount}`,
          bonusCredits: sql`${creditBalances.bonusCredits} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(creditBalances.teamId, teamId));

      // Create bonus transaction record
      await tx.insert(creditTransactions).values({
        teamId,
        transactionType: CreditTransactionType.BONUS,
        amount: amount.toString(),
        balanceBefore: available.toString(),
        balanceAfter: (available + amount).toString(),
        metadata: {
          reason,
          addedAt: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Failed to add bonus credits:', error);
    throw error;
  }
}

/**
 * Rollback a transaction (for error recovery)
 */
export async function rollbackTransaction(transactionId: number): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Get the original transaction
      const [transaction] = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.id, transactionId))
        .limit(1);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Lock the credit balance row
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.teamId, transaction.teamId))
        .for('update');

      if (!balance) {
        throw new Error('Credit balance not found');
      }

      const amount = parseFloat(transaction.amount);
      const available = parseFloat(balance.availableCredits);

      // Reverse the transaction based on type
      switch (transaction.transactionType) {
        case CreditTransactionType.RESERVATION:
          // Refund reservation
          await tx
            .update(creditBalances)
            .set({
              availableCredits: sql`${creditBalances.availableCredits} + ${amount}`,
              reservedCredits: sql`${creditBalances.reservedCredits} - ${amount}`,
              updatedAt: new Date()
            })
            .where(eq(creditBalances.teamId, transaction.teamId));
          break;

        case CreditTransactionType.DEDUCTION:
          // Restore deducted credits
          await tx
            .update(creditBalances)
            .set({
              availableCredits: sql`${creditBalances.availableCredits} + ${amount}`,
              updatedAt: new Date()
            })
            .where(eq(creditBalances.teamId, transaction.teamId));
          break;

        default:
          throw new Error(`Cannot rollback transaction type: ${transaction.transactionType}`);
      }

      // Create rollback transaction record
      await tx.insert(creditTransactions).values({
        teamId: transaction.teamId,
        jobId: transaction.jobId,
        transactionType: CreditTransactionType.REFUND,
        amount: amount.toString(),
        balanceBefore: available.toString(),
        balanceAfter: (available + amount).toString(),
        metadata: {
          rollbackOf: transactionId,
          rollbackReason: 'Transaction rollback',
          rollbackAt: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Failed to rollback transaction:', error);
    throw error;
  }
}
