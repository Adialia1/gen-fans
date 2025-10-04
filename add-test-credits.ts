import { db } from './lib/db/drizzle';
import { creditBalances } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function addCredits() {
  // Add 500 credits to team 1 (test team)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const [result] = await db
    .update(creditBalances)
    .set({
      availableCredits: '500.00',
      totalAllocated: '500.00',
      nextReplenishmentAt: nextMonth
    })
    .where(eq(creditBalances.teamId, 1))
    .returning();

  if (result) {
    console.log('✅ Added 500 credits to team 1');
    console.log(`   Available: ${result.availableCredits}`);
    console.log(`   Total Allocated: ${result.totalAllocated}`);
  } else {
    console.log('❌ Team 1 not found - creating credit balance...');

    await db.insert(creditBalances).values({
      teamId: 1,
      availableCredits: '500.00',
      reservedCredits: '0.00',
      bonusCredits: '0.00',
      totalAllocated: '500.00',
      nextReplenishmentAt: nextMonth
    });

    console.log('✅ Created credit balance with 500 credits for team 1');
  }

  process.exit(0);
}

addCredits().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
