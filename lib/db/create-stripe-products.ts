import { stripe } from '../payments/stripe';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...\n');

  // Create Starter Product
  const starterProduct = await stripe.products.create({
    name: 'Starter',
    description: '315 credits/month - Up to 300 images + 3 videos (5sec)',
    metadata: {
      credits: '315',
      plan_type: 'starter'
    }
  });

  // Starter Monthly Price ($40)
  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 4000, // $40 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      credits: '315',
      plan_type: 'starter'
    }
  });

  // Starter Yearly Price ($30/month = $360/year)
  const starterYearly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 36000, // $360 in cents
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      credits: '315',
      plan_type: 'starter'
    }
  });

  // Create Ultra Product
  const ultraProduct = await stripe.products.create({
    name: 'Ultra',
    description: '1,750 credits/month - Up to 1,000 images + 150 videos (5sec)',
    metadata: {
      credits: '1750',
      plan_type: 'ultra'
    }
  });

  // Ultra Monthly Price ($299)
  const ultraMonthly = await stripe.prices.create({
    product: ultraProduct.id,
    unit_amount: 29900, // $299 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      credits: '1750',
      plan_type: 'ultra'
    }
  });

  // Ultra Yearly Price ($250/month = $3000/year)
  const ultraYearly = await stripe.prices.create({
    product: ultraProduct.id,
    unit_amount: 300000, // $3000 in cents
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      credits: '1750',
      plan_type: 'ultra'
    }
  });

  console.log('✅ Stripe products and prices created successfully!\n');

  console.log('📦 Starter Plan:');
  console.log('   Product ID:', starterProduct.id);
  console.log('   Monthly Price ID:', starterMonthly.id, '($40/mo)');
  console.log('   Yearly Price ID:', starterYearly.id, '($30/mo = $360/yr)');

  console.log('\n🚀 Ultra Plan:');
  console.log('   Product ID:', ultraProduct.id);
  console.log('   Monthly Price ID:', ultraMonthly.id, '($299/mo)');
  console.log('   Yearly Price ID:', ultraYearly.id, '($250/mo = $3000/yr)');

  console.log('\n💡 Add these Price IDs to your pricing page!');
}

createStripeProducts()
  .catch((error) => {
    console.error('Stripe products creation failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Process finished. Exiting...');
    process.exit(0);
  });