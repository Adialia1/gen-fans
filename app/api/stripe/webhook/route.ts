import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { replenishTeamCredits } from '@/lib/credits/credit-service';
import { getTeamByStripeCustomerId } from '@/lib/db/queries';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // First update the subscription (this updates plan name)
      await handleSubscriptionChange(subscription);

      // Then allocate credits based on the NEW plan
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        const team = await getTeamByStripeCustomerId(customerId);
        if (team) {
          try {
            console.log(`Allocating credits for team ${team.id} after ${event.type} event`);
            await replenishTeamCredits(team.id);
            console.log(`Credits successfully allocated for team ${team.id}`);
          } catch (error) {
            console.error(`Failed to allocate credits for team ${team.id}:`, error);
          }
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // Handle subscription cancellation
      const canceledSubscription = event.data.object as Stripe.Subscription;
      const canceledCustomerId = canceledSubscription.customer as string;

      await handleSubscriptionChange(canceledSubscription);

      // Reset credits to 0 when subscription is cancelled
      const canceledTeam = await getTeamByStripeCustomerId(canceledCustomerId);
      if (canceledTeam) {
        try {
          console.log(`Resetting credits for team ${canceledTeam.id} due to subscription cancellation`);
          await replenishTeamCredits(canceledTeam.id); // Will allocate 0 credits since plan is null
          console.log(`Credits reset to 0 for team ${canceledTeam.id}`);
        } catch (error) {
          console.error(`Failed to reset credits for team ${canceledTeam.id}:`, error);
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      // Replenish credits on successful monthly payment (new billing cycle)
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceCustomerId = invoice.customer as string;

      if (invoiceCustomerId) {
        const team = await getTeamByStripeCustomerId(invoiceCustomerId);
        if (team) {
          try {
            console.log(`Credits replenished for team ${team.id} on successful payment (new billing cycle)`);
            await replenishTeamCredits(team.id);
            console.log(`Credits successfully replenished for team ${team.id}`);
          } catch (error) {
            console.error(`Failed to replenish credits for team ${team.id}:`, error);
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Handle payment failure - reset credits to 0 and notify user
      const failedInvoice = event.data.object as Stripe.Invoice;
      const failedCustomerId = failedInvoice.customer as string;

      if (failedCustomerId) {
        const team = await getTeamByStripeCustomerId(failedCustomerId);
        if (team) {
          try {
            console.log(`⚠️  Payment failed for team ${team.id} - resetting credits to 0`);

            // Reset credits to 0 immediately
            await replenishTeamCredits(team.id);

            console.log(`Credits reset to 0 for team ${team.id} due to payment failure`);

            // Note: Stripe will automatically update subscription status to 'past_due' or 'unpaid'
            // which will trigger a subscription.updated event
          } catch (error) {
            console.error(`Failed to handle payment failure for team ${team.id}:`, error);
          }
        }
      }
      break;
    }

    case 'checkout.session.completed': {
      // Handle successful checkout - allocate credits immediately
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutCustomerId = session.customer as string;

      if (checkoutCustomerId) {
        const team = await getTeamByStripeCustomerId(checkoutCustomerId);
        if (team) {
          try {
            console.log(`Checkout completed for team ${team.id} - allocating credits`);
            await replenishTeamCredits(team.id);
            console.log(`Credits allocated for team ${team.id} after checkout`);
          } catch (error) {
            console.error(`Failed to allocate credits for team ${team.id} after checkout:`, error);
          }
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
