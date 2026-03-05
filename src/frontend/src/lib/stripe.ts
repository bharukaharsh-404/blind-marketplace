// Stripe Connect Configuration
//
// TO CONFIGURE STRIPE:
// 1. Create an account at https://stripe.com
// 2. Enable Stripe Connect in your dashboard
// 3. Go to Developers > API Keys
// 4. Copy your PUBLISHABLE key (pk_test_...) and SECRET key (sk_test_...)
//
// STRIPE CONNECT SETUP:
// 1. In Stripe Dashboard, go to Connect > Settings
// 2. Choose "Standard" account type for writers
// 3. Set platform fee to 15% on each transaction
//
// TEST CARDS (Test Mode):
// Success: 4242 4242 4242 4242 | Exp: any future date | CVV: any 3 digits
// Decline: 4000 0000 0000 0002
// Auth required: 4000 0025 0000 3155
//
// WEBHOOK SETUP (for production):
// 1. Stripe Dashboard > Developers > Webhooks
// 2. Add endpoint: https://your-domain.com/api/stripe/webhook
// 3. Listen for: payment_intent.succeeded, payment_intent.payment_failed, transfer.created
// 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET below

// PLACEHOLDER: Replace with your Stripe publishable key
// Format: pk_test_xxxxxxxxxxxxxxxxxxxxxxxx (Test Mode)
// Format: pk_live_xxxxxxxxxxxxxxxxxxxxxxxx (Live Mode — only for production)
export const STRIPE_PUBLISHABLE_KEY =
  "pk_test_placeholder_replace_with_real_key";

// Platform commission rate (15%)
export const PLATFORM_COMMISSION_RATE = 0.15;

// Calculate payment split
export function calculatePaymentSplit(budget: number): {
  platformFee: number;
  writerReceives: number;
  total: number;
} {
  const platformFee = budget * PLATFORM_COMMISSION_RATE;
  const writerReceives = budget - platformFee;
  return { platformFee, writerReceives, total: budget };
}

// Generate a mock payment intent ID for testing
// In production, this would be created server-side via Stripe API
export function generateMockPaymentIntentId(): string {
  return `pi_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const isStripeConfigured =
  STRIPE_PUBLISHABLE_KEY !== "pk_test_placeholder_replace_with_real_key";
