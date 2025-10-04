import { db } from '../drizzle';
import { creditPricingConfig } from '../schema';

export async function seedCreditPricing() {
  console.log('Seeding credit pricing configuration...');

  const pricingConfigs = [
    {
      operationType: 'model_creation',
      baseCost: '50.00',
      multipliers: {
        referenceComplexity: 1.5, // Multiply by reference model's complexityFactor
        trainingImagesMultiplier: 0.5, // Extra cost per additional training image
      },
      active: true,
    },
    {
      operationType: 'model_refinement',
      baseCost: '30.00',
      multipliers: {
        refinementIterationMultiplier: 1.2, // Multiply by refinement iteration count
        modelComplexityMultiplier: 1.1, // Multiply by current model complexity
      },
      active: true,
    },
    {
      operationType: 'image_generation',
      baseCost: '5.00',
      multipliers: {
        resolutionMultiplier: {
          '512x512': 1.0,
          '1024x1024': 2.0,
          '1536x1536': 3.5,
        },
        qualityMultiplier: {
          normal: 1.0,
          hd: 1.5,
        },
        modelComplexityMultiplier: 1.2, // Multiply by custom model complexity
      },
      active: true,
    },
  ];

  try {
    await db.insert(creditPricingConfig).values(pricingConfigs);
    console.log(`✓ Seeded ${pricingConfigs.length} pricing configurations`);
  } catch (error) {
    console.error('Error seeding credit pricing:', error);
    throw error;
  }
}
