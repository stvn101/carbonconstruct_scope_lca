/**
 * Stripe Webhook Handler for CarbonConstruct
 * 
 * This serverless function handles Stripe webhook events for subscription management.
 * Deploy to Vercel as an API route.
 * 
 * Environment variables required:
 * - STRIPE_SECRET_KEY (rk_live_...)
 * - STRIPE_WEBHOOK_SECRET (whsec_...)
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook event handlers
const eventHandlers = {
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'customer.subscription.trial_will_end': handleTrialWillEnd,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'checkout.session.completed': handleCheckoutCompleted,
};

/**
 * Main webhook handler
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Received event:', event.type);

  try {
    // Get the handler for this event type
    const handler = eventHandlers[event.type];

    if (handler) {
      await handler(event.data.object);
      console.log(`Successfully handled ${event.type}`);
    } else {
      console.log(`No handler for event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    
    // Log error to database for debugging
    await logWebhookError(event, error);
    
    // Still return 200 to prevent retries for unrecoverable errors
    return res.status(200).json({ 
      received: true, 
      error: error.message 
    });
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const { customer, id, status, current_period_start, current_period_end, 
          trial_start, trial_end, items, metadata } = subscription;

  const userId = metadata.user_id;
  if (!userId) {
    throw new Error('No user_id in subscription metadata');
  }

  const planId = items.data[0]?.price?.lookup_key || items.data[0]?.price?.id;
  const planName = items.data[0]?.price?.nickname || getPlanNameFromId(planId);

  // Insert subscription into database
  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: id,
      stripe_customer_id: customer,
      status: status,
      plan_id: planId,
      plan_name: planName,
      current_period_start: new Date(current_period_start * 1000).toISOString(),
      current_period_end: new Date(current_period_end * 1000).toISOString(),
      trial_start: trial_start ? new Date(trial_start * 1000).toISOString() : null,
      trial_end: trial_end ? new Date(trial_end * 1000).toISOString() : null,
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;

  // Log activity
  await logActivity(userId, 'subscription_created', `Subscribed to ${planName} plan`);

  // Send welcome email (optional)
  await sendWelcomeEmail(userId, planName);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const { id, status, current_period_end, cancel_at_period_end, items } = subscription;

  const planId = items.data[0]?.price?.lookup_key || items.data[0]?.price?.id;
  const planName = items.data[0]?.price?.nickname || getPlanNameFromId(planId);

  // Update subscription in database
  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: status,
      plan_id: planId,
      plan_name: planName,
      current_period_end: new Date(current_period_end * 1000).toISOString(),
      cancel_at_period_end: cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', id);

  if (error) throw error;

  // Log activity
  await logActivity(
    existingSub.user_id, 
    'subscription_updated', 
    `Subscription updated to ${planName}`
  );
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const { id } = subscription;

  // Get user_id before updating
  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', id)
    .single();

  if (fetchError) throw fetchError;

  // Update subscription status to canceled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', id);

  if (error) throw error;

  // Log activity
  await logActivity(existingSub.user_id, 'subscription_canceled', 'Subscription canceled');

  // Send cancellation email
  await sendCancellationEmail(existingSub.user_id);
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription) {
  const { id, trial_end } = subscription;

  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', id)
    .single();

  if (fetchError) throw fetchError;

  const daysLeft = Math.ceil((trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24));

  // Log activity
  await logActivity(
    sub.user_id, 
    'trial_ending', 
    `Trial ends in ${daysLeft} days`
  );

  // Send trial ending email
  await sendTrialEndingEmail(sub.user_id, daysLeft);
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice) {
  const { customer, subscription, amount_paid, created, number, status } = invoice;

  // Get user from subscription
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id, plan_name')
    .eq('stripe_subscription_id', subscription)
    .single();

  if (fetchError) {
    console.warn('Subscription not found for invoice:', subscription);
    return; // Not all invoices are for subscriptions
  }

  // Store invoice record
  const { error } = await supabase
    .from('invoices')
    .insert({
      user_id: sub.user_id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscription,
      stripe_customer_id: customer,
      amount: amount_paid,
      status: status,
      invoice_number: number,
      description: `${sub.plan_name} subscription`,
      created_at: new Date(created * 1000).toISOString()
    });

  if (error) throw error;

  // Log activity
  await logActivity(
    sub.user_id, 
    'payment_received', 
    `Payment of $${(amount_paid / 100).toFixed(2)} received`
  );
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
  const { subscription, attempt_count } = invoice;

  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription)
    .single();

  if (fetchError) {
    console.warn('Subscription not found for failed invoice:', subscription);
    return;
  }

  // Log activity
  await logActivity(
    sub.user_id, 
    'payment_failed', 
    `Payment failed (attempt ${attempt_count})`
  );

  // Send payment failed email
  await sendPaymentFailedEmail(sub.user_id, attempt_count);
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  const { customer, subscription, metadata } = session;

  if (!subscription) return; // Not a subscription checkout

  const userId = metadata?.user_id;
  if (!userId) {
    console.warn('No user_id in checkout session metadata');
    return;
  }

  // Update user's stripe customer ID if not already set
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      stripe_customer_id: customer,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) console.error('Error updating user profile:', error);

  // Log activity
  await logActivity(userId, 'checkout_completed', 'Checkout completed successfully');
}

/**
 * Helper: Log activity to database
 */
async function logActivity(userId, type, title) {
  try {
    await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Helper: Log webhook error
 */
async function logWebhookError(event, error) {
  try {
    await supabase
      .from('webhook_errors')
      .insert({
        event_type: event.type,
        event_id: event.id,
        error_message: error.message,
        error_stack: error.stack,
        payload: event.data.object,
        created_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Error logging webhook error:', logError);
  }
}

/**
 * Helper: Get plan name from ID
 */
function getPlanNameFromId(planId) {
  const planMap = {
    'starter': 'Starter',
    'professional': 'Professional',
    'enterprise': 'Enterprise'
  };
  return planMap[planId] || 'Unknown Plan';
}

/**
 * Email helpers (implement with your email service)
 */
async function sendWelcomeEmail(userId, planName) {
  // TODO: Implement with SendGrid, Resend, or other email service
  console.log(`Sending welcome email to user ${userId} for ${planName} plan`);
}

async function sendCancellationEmail(userId) {
  // TODO: Implement
  console.log(`Sending cancellation email to user ${userId}`);
}

async function sendTrialEndingEmail(userId, daysLeft) {
  // TODO: Implement
  console.log(`Sending trial ending email to user ${userId} (${daysLeft} days left)`);
}

async function sendPaymentFailedEmail(userId, attemptCount) {
  // TODO: Implement
  console.log(`Sending payment failed email to user ${userId} (attempt ${attemptCount})`);
}

// Export config for Vercel
export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for signature verification
  },
};
