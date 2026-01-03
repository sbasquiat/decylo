# Stripe Webhook Setup Checklist

## Webhook Endpoint
**URL:** `https://decylo.com/api/stripe/webhook`

## Required Environment Variables (Vercel)

Make sure these are set in your Vercel project:

1. **STRIPE_SECRET_KEY**
   - Get from: Stripe Dashboard → Developers → API keys
   - Use your **Secret key** (starts with `sk_`)

2. **STRIPE_WEBHOOK_SECRET**
   - Get from: Stripe Dashboard → Developers → Webhooks → Click your webhook → "Signing secret"
   - Starts with `whsec_`
   - ⚠️ **Important:** This is different from your API key!

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Required for webhook to update user profiles
   - Get from: Supabase Dashboard → Settings → API → service_role key

4. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL

## Stripe Dashboard Configuration

### Step 1: Create Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://decylo.com/api/stripe/webhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **"Add endpoint"**

### Step 2: Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. In the "Signing secret" section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)
4. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### Step 3: Test the Webhook

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **"Send test webhook"**
3. Select event: `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check Vercel logs to see if it was received

## Verify Webhook is Working

### Check Recent Events

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Check the **"Events"** tab
4. Look for recent events (should show after a checkout)
5. Click on an event to see:
   - **Status:** Should be "Succeeded" (green) or "Failed" (red)
   - **Response:** Should show `{"received": true}`

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Filter for: `/api/stripe/webhook`
3. Look for:
   - ✅ `upgrade_completed` logs (success)
   - ❌ Error messages (failure)

### Common Webhook Issues

#### Issue: "Webhook signature verification failed"
**Cause:** `STRIPE_WEBHOOK_SECRET` doesn't match Stripe's signing secret
**Fix:**
1. Get the correct signing secret from Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Redeploy

#### Issue: "Webhook secret not configured"
**Cause:** `STRIPE_WEBHOOK_SECRET` environment variable is missing
**Fix:**
1. Add `STRIPE_WEBHOOK_SECRET` to Vercel environment variables
2. Redeploy

#### Issue: Events show "Failed" in Stripe
**Cause:** Webhook endpoint returned an error
**Fix:**
1. Check Vercel logs for error details
2. Common causes:
   - Missing database columns (run `migration_subscriptions.sql`)
   - Missing environment variables
   - Service role key doesn't have permissions

## Testing Locally

If you want to test webhooks locally:

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. In another terminal, trigger test: `stripe trigger checkout.session.completed`

## Production Checklist

Before going live, verify:

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook signing secret copied to Vercel as `STRIPE_WEBHOOK_SECRET`
- [ ] All required events selected (checkout.session.completed, customer.subscription.*)
- [ ] Webhook is enabled (not disabled)
- [ ] Test webhook sent successfully
- [ ] Vercel logs show webhook received
- [ ] Database columns exist (run `migration_subscriptions.sql`)
- [ ] User profile updates after test checkout

## Next Steps After Setup

1. Test with a real checkout (use Stripe test mode)
2. Verify user's `is_pro` field updates in database
3. Check that upgrade receipt email is sent
4. Verify settings page shows "Pro" status

