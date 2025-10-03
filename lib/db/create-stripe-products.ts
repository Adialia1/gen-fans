import { stripe } from '../payments/stripe';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
  console.log('Base Product ID:', baseProduct.id);
  console.log('Plus Product ID:', plusProduct.id);
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