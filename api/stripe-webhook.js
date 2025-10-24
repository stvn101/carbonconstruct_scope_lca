// Stripe Webhook Handler - Serverless function for Stripe events
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (!stripe || !webhookSecret) {
        console.error('Missing Stripe configuration');
        res.status(500).json({ 
            success: false, 
            error: 'Stripe not configured' 
        });
        return;
    }

    try {
        const signature = req.headers['stripe-signature'];
        const payload = JSON.stringify(req.body);

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            res.status(400).json({ 
                success: false, 
                error: 'Invalid signature' 
            });
            return;
        }

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log('💰 Payment succeeded:', event.data.object.id);
                await handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                console.log('❌ Payment failed:', event.data.object.id);
                await handlePaymentFailure(event.data.object);
                break;

            case 'customer.subscription.created':
                console.log('🎯 Subscription created:', event.data.object.id);
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                console.log('🔄 Subscription updated:', event.data.object.id);
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                console.log('🗑️ Subscription cancelled:', event.data.object.id);
                await handleSubscriptionCancelled(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                console.log('📄 Invoice paid:', event.data.object.id);
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                console.log('📄❌ Invoice payment failed:', event.data.object.id);
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                console.log('🔔 Unhandled event type:', event.type);
        }

        // Return success response
        res.status(200).json({
            success: true,
            event_type: event.type,
            event_id: event.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Handler functions for different event types
async function handlePaymentSuccess(paymentIntent) {
    // TODO: Update user's premium status in Supabase
    // TODO: Send confirmation email
    console.log('Processing successful payment:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer: paymentIntent.customer
    });
}

async function handlePaymentFailure(paymentIntent) {
    // TODO: Log failed payment
    // TODO: Notify user of payment issue
    console.log('Processing failed payment:', {
        id: paymentIntent.id,
        customer: paymentIntent.customer,
        failure_reason: paymentIntent.last_payment_error?.message
    });
}

async function handleSubscriptionCreated(subscription) {
    // TODO: Update user subscription status in Supabase
    // TODO: Enable premium features
    console.log('Processing new subscription:', {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        current_period_end: subscription.current_period_end
    });
}

async function handleSubscriptionUpdated(subscription) {
    // TODO: Update subscription details in Supabase
    console.log('Processing subscription update:', {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
    });
}

async function handleSubscriptionCancelled(subscription) {
    // TODO: Revoke premium access in Supabase
    // TODO: Send cancellation confirmation
    console.log('Processing subscription cancellation:', {
        id: subscription.id,
        customer: subscription.customer,
        cancelled_at: subscription.canceled_at
    });
}

async function handleInvoicePaid(invoice) {
    // TODO: Update billing records in Supabase
    console.log('Processing paid invoice:', {
        id: invoice.id,
        subscription: invoice.subscription,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency
    });
}

async function handleInvoicePaymentFailed(invoice) {
    // TODO: Handle failed invoice payment
    // TODO: Potentially downgrade user access
    console.log('Processing failed invoice payment:', {
        id: invoice.id,
        subscription: invoice.subscription,
        amount_due: invoice.amount_due
    });
}