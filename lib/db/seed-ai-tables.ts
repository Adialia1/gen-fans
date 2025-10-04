import { db } from './drizzle';
import { referenceModels, creditPricingConfig } from './schema';
import { seedReferenceModels } from './seeds/reference-models';
import { seedCreditPricing } from './seeds/credit-pricing';
import { eq } from 'drizzle-orm';

async function seedAITables() {
  try {
    // Check if reference models exist
    const existingModels = await db.select().from(referenceModels).limit(1);

    if (existingModels.length === 0) {
      console.log('Seeding reference models...');
      await seedReferenceModels();
    } else {
      console.log('Reference models already seeded, skipping...');
    }

    // Check if credit pricing config exists
    const existingPricing = await db.select().from(creditPricingConfig).limit(1);

    if (existingPricing.length === 0) {
      console.log('Seeding credit pricing config...');
      await seedCreditPricing();
    } else {
      console.log('Credit pricing config already seeded, skipping...');
    }

    console.log('✓ AI tables seed complete!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedAITables();
