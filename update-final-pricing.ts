import { db } from './lib/db/drizzle';
import { creditPricingConfig } from './lib/db/schema';

async function updateFinalPricing() {
  console.log('Updating final credit pricing configuration...\n');

  // Delete old pricing
  await db.delete(creditPricingConfig);

  // Insert new simplified pricing
  const newPricing = [
    {
      operationType: 'image_generation',
      baseCost: '1.00', // 1 credit = 1 image
      multipliers: {},
      active: true
    },
    {
      operationType: 'video_generation_5sec',
      baseCost: '5.00', // 5 credits = 1 video (5sec)
      multipliers: {},
      active: true
    },
    {
      operationType: 'video_generation_10sec',
      baseCost: '10.00', // 10 credits = 1 video (10sec)
      multipliers: {},
      active: true
    },
    {
      operationType: 'ai_prompt_generation',
      baseCost: '0.00', // Free - included in plans
      multipliers: {},
      active: true
    }
  ];

  for (const pricing of newPricing) {
    await db.insert(creditPricingConfig).values(pricing);
    console.log(`✅ ${pricing.operationType}: ${pricing.baseCost} credits`);
  }

  console.log('\n📊 Plans Overview:');
  console.log('\n💵 Starter ($40/mo or $30/mo yearly):');
  console.log('   - 315 credits/month');
  console.log('   - Up to 300 images + 3 videos (5sec)');
  console.log('   - Cost: $11.05 | Profit: $28.95 (72% margin)');

  console.log('\n🚀 Ultra ($299/mo or $250/mo yearly):');
  console.log('   - 1,750 credits/month');
  console.log('   - Up to 1,000 images + 150 videos (5sec)');
  console.log('   - Cost: $133.75 | Profit: $165.25 (55% margin)');

  console.log('\n✅ Pricing updated successfully!');
  process.exit(0);
}

updateFinalPricing().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
