# Stripe Monetization Setup Guide

## Environment Variables

Add these to your `.env.local`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...

# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## Stripe Setup Steps

1. **Create Stripe Account** (if not already)
   - Go to https://stripe.com
   - Create account or sign in

2. **Create Products & Prices**
   - Dashboard → Products → Add Product
   - Product: "Decylo Pro"
   - Add Price:
     - Monthly: €10/month, recurring
     - Yearly: €96/year (€8/month), recurring
   - Copy the Price IDs (starts with `price_...`)
   - Add to `.env.local`:
     - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...`
     - `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...`

3. **Get API Keys**
   - Dashboard → Developers → API keys
   - Copy "Secret key" (starts with `sk_test_...` or `sk_live_...`)
   - Add to `.env.local`: `STRIPE_SECRET_KEY=sk_...`

4. **Set Up Webhook**
   - Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing: Use Stripe CLI (see below)
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy "Signing secret" (starts with `whsec_...`)
   - Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

5. **Get Supabase Service Role Key**
   - Supabase Dashboard → Settings → API
   - Copy "service_role" key (keep this secret!)
   - Add to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...`

## Local Webhook Testing (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret shown and use it in `.env.local`

## Database Migration

Run the migration script in Supabase SQL editor:
```sql
-- See: supabase/migration_subscriptions.sql
```

This adds:
- `is_pro` (boolean)
- `stripe_customer_id` (text)
- `stripe_subscription_status` (text)
- `updated_at` (timestamp)

## Testing

1. **Test Checkout Flow**
   - Go to `/pricing`
   - Click "Upgrade to Pro"
   - Complete test payment (use card: 4242 4242 4242 4242)
   - Verify `is_pro` is set to `true` in Supabase

2. **Test Webhook**
   - Use Stripe CLI to forward webhooks locally
   - Or use Stripe Dashboard → Webhooks → Send test webhook
   - Verify subscription status updates in Supabase

3. **Test Paywalls**
   - As free user: Try to view decision older than 7 days
   - As free user: Try to view advanced insights
   - As free user: Try to export
   - All should show paywall modal

4. **Test Portal**
   - As Pro user: Go to `/app/settings`
   - Click "Manage subscription"
   - Should open Stripe Customer Portal

## Production Checklist

- [ ] Create live Stripe account
- [ ] Create live products & prices
- [ ] Set up production webhook endpoint
- [ ] Update environment variables in production
- [ ] Test checkout flow with real card
- [ ] Test subscription cancellation
- [ ] Verify webhook events are received
- [ ] Monitor Stripe Dashboard for errors


