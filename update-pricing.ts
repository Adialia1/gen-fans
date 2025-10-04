import { db } from './lib/db/drizzle';
import { creditPricingConfig } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function updatePricing() {
  console.log('Updating credit pricing configuration...');

  // Delete old pricing
  await db.delete(creditPricingConfig);

  // Insert new pricing
  const newPricing = [
    {
      operationType: 'model_creation',
      baseCost: '25.00', // 25 credits = $1.00 value, costs us $0.50
      multipliers: {
        referenceComplexity: 1.0,
        trainingImagesMultiplier: 0
      },
      active: true
    },
    {
      operationType: 'image_generation',
      baseCost: '3.00', // 3 credits = $0.12 value, costs us $0.04
      multipliers: {
        qualityMultiplier: 1.0,
        resolutionMultiplier: 1.0
      },
      active: true
    },
    {
      operationType: 'video_generation_5sec',
      baseCost: '15.00', // 15 credits = $0.60 value, costs us $0.36
      multipliers: {},
      active: true
    },
    {
      operationType: 'video_generation_10sec',
      baseCost: '30.00', // 30 credits = $1.20 value, costs us $0.71
      multipliers: {},
      active: true
    },
    {
      operationType: 'ai_prompt_generation',
      baseCost: '1.00', // 1 credit = $0.04 value, costs us $0.01
      multipliers: {},
      active: true
    }
  ];

  for (const pricing of newPricing) {
    await db.insert(creditPricingConfig).values(pricing);
    console.log(`✅ Added pricing for ${pricing.operationType}`);
  }

  console.log('\n✅ All pricing updated successfully!');
  console.log('\nCredit Costs:');
  console.log('- Model Creation: 25 credits ($1.00 value)');
  console.log('- Image Generation: 3 credits ($0.12 value)');
  console.log('- Video 5sec: 15 credits ($0.60 value)');
  console.log('- Video 10sec: 30 credits ($1.20 value)');
  console.log('- AI Prompt: 1 credit ($0.04 value)');
  console.log('\n1 credit = $0.04');

  process.exit(0);
}

updatePricing().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
