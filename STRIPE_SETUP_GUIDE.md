# Stripe Setup Guide - Step by Step

**Status:** Code is ready, just needs configuration! ✅

---

## 🎯 Quick Overview

Your Stripe integration is **100% complete**. You just need to:
1. Create a Stripe account
2. Create products & prices
3. Set up webhook
4. Add environment variables
5. Run database migration
6. Test!

**Time required:** ~15-20 minutes

---

## 📋 Step-by-Step Setup

### **Step 1: Create Stripe Account** (2 minutes)

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" or "Sign in"
3. Complete account setup
4. **Important:** Start in **Test Mode** (toggle in top right)
   - Test mode lets you test without real charges
   - Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)

---

### **Step 2: Create Product & Prices** (5 minutes)

1. In Stripe Dashboard, go to **Products** → **Add Product**

2. **Product Details:**
   - **Name:** `Decylo Pro`
   - **Description:** `Turn experience into better judgment`
   - Click **Save**

3. **Add Monthly Price:**
   - Click **Add Price** on the product
   - **Pricing model:** Standard pricing
   - **Price:** `€10.00`
   - **Billing period:** Recurring → Monthly
   - **Currency:** EUR (or your preferred currency)
   - Click **Add price**
   - **Copy the Price ID** (starts with `price_...`)
   - Example: `price_1ABC123xyz...`

4. **Add Yearly Price:**
   - Still on the same product, click **Add Price** again
   - **Price:** `€89.00`
   - **Billing period:** Recurring → Yearly
   - **Currency:** EUR
   - Click **Add price**
   - **Copy the Price ID** (starts with `price_...`)

5. **Save both Price IDs somewhere safe** - you'll need them in Step 4

---

### **Step 3: Get Stripe API Keys** (1 minute)

1. In Stripe Dashboard, go to **Developers** → **API keys**

2. **Secret Key:**
   - Under "Secret key", click **Reveal test key**
   - Copy the key (starts with `sk_test_...`)
   - ⚠️ **Keep this secret!** Never commit to git

3. **Publishable Key (optional):**
   - You might see a "Publishable key" - you don't need it for this setup
   - The code uses server-side checkout only

---

### **Step 4: Set Up Webhook** (5 minutes)

#### **For Production (when deployed):**

1. In Stripe Dashboard, go to **Developers** → **Webhooks**

2. Click **Add endpoint**

3. **Endpoint URL:**
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
   Replace `yourdomain.com` with your actual domain

4. **Events to listen for:**
   - Click "Select events"
   - Choose these events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
   - Click **Add events**

5. Click **Add endpoint**

6. **Copy the Signing secret:**
   - On the webhook page, click the webhook you just created
   - Under "Signing secret", click **Reveal**
   - Copy the secret (starts with `whsec_...`)

#### **For Local Development (testing now):**

You'll use Stripe CLI to forward webhooks to your local server:

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```
   This will open your browser to authorize

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret:**
   - The CLI will show: `Ready! Your webhook signing secret is whsec_...`
   - Copy this `whsec_...` value
   - Use this in your `.env.local` for local testing

---

### **Step 5: Get Supabase Service Role Key** (2 minutes)

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Under "Project API keys", find **service_role** key
4. Click **Reveal** and copy the key (starts with `eyJhbGci...`)
5. ⚠️ **Keep this secret!** This key bypasses RLS - never commit to git

---

### **Step 6: Run Database Migration** (1 minute)

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file: `supabase/migration_subscriptions.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify success message

**What this does:**
- Adds `is_pro`, `stripe_customer_id`, `stripe_subscription_status` columns
- Creates indexes for faster lookups
- Sets up auto-update trigger for `updated_at`

---

### **Step 7: Add Environment Variables** (2 minutes)

1. Open your `.env.local` file (create it if it doesn't exist)

2. Add these variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...

# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Your existing Supabase vars (keep these)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Replace:**
- `sk_test_...` with your Stripe Secret Key from Step 3
- `whsec_...` with your Webhook Signing Secret from Step 4
- `price_...` (monthly) with your Monthly Price ID from Step 2
- `price_...` (yearly) with your Yearly Price ID from Step 2
- `eyJhbGci...` (service role) with your Supabase Service Role Key from Step 5

3. **Save the file**

4. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

---

### **Step 8: Install Stripe Package** (if not already installed)

Check if `stripe` is in your `package.json`:

```bash
npm list stripe
```

If not installed:

```bash
npm install stripe
```

---

### **Step 9: Test the Flow** (5 minutes)

#### **Test 1: Checkout Flow**

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test checkout:**
   - Sign in to your app
   - Go to `/upgrade` or `/pricing`
   - Click "Upgrade to Pro"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Complete checkout

4. **Verify:**
   - You should be redirected to `/app/settings?success=true`
   - Check Supabase: `profiles` table → `is_pro` should be `true`
   - Check Stripe Dashboard: You should see the subscription

#### **Test 2: Webhook Events**

1. In the terminal running `stripe listen`, you should see:
   ```
   checkout.session.completed [200]
   customer.subscription.created [200]
   ```

2. If you see errors, check:
   - Webhook secret is correct
   - Service role key is correct
   - Database migration ran successfully

#### **Test 3: Pro Features**

1. After successful checkout:
   - Go to `/app/insights` - Advanced sections should be visible
   - Go to `/app/timeline` - Should see all decisions (not just 7 days)
   - Go to `/app/settings` - Should see "Manage Subscription" button

#### **Test 4: Customer Portal**

1. Go to `/app/settings`
2. Click "Manage Subscription"
3. Should open Stripe Customer Portal
4. You can cancel subscription (it will update `is_pro` to `false`)

---

## 🐛 Troubleshooting

### **Error: "STRIPE_SECRET_KEY is not set"**
- Check `.env.local` exists and has `STRIPE_SECRET_KEY`
- Restart dev server after adding env vars

### **Error: "Webhook signature verification failed"**
- Check `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`
- For production, use the webhook secret from Stripe Dashboard

### **Error: "Supabase admin credentials not configured"**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify it's the service_role key (not anon key)

### **Checkout works but `is_pro` doesn't update**
- Check webhook is receiving events (see `stripe listen` output)
- Check Supabase logs for errors
- Verify service role key has correct permissions

### **"No subscription found" when accessing portal**
- User needs to complete checkout first
- Check `stripe_customer_id` is saved in `profiles` table

---

## 🚀 Production Checklist

When ready to go live:

1. **Switch Stripe to Live Mode:**
   - Toggle "Test mode" off in Stripe Dashboard
   - Get new **Live** API keys
   - Update `STRIPE_SECRET_KEY` in production env vars

2. **Create Live Products:**
   - Create the same products in Live mode
   - Get new Price IDs
   - Update `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`

3. **Set Up Production Webhook:**
   - Create webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select the same events
   - Copy production webhook secret
   - Update `STRIPE_WEBHOOK_SECRET` in production env vars

4. **Update Environment Variables:**
   - In your hosting platform (Vercel, etc.)
   - Add all Stripe env vars
   - Use **Live** keys (not test keys)

5. **Test with Real Card:**
   - Use a real card (you can refund immediately)
   - Verify subscription works
   - Verify cancellation works

---

## 📝 Environment Variables Summary

**Required for Stripe:**

```env
# Stripe API
STRIPE_SECRET_KEY=sk_test_...          # From Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_...        # From Webhooks → Signing secret

# Stripe Prices (public - safe to expose)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...  # From Products → Monthly price
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...   # From Products → Yearly price

# Supabase (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # From Settings → API → service_role
```

**Already have:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Stripe account created
- [ ] Product "Decylo Pro" created
- [ ] Monthly price (€10) created
- [ ] Yearly price (€89) created
- [ ] Price IDs copied
- [ ] Stripe Secret Key copied
- [ ] Webhook endpoint created (or Stripe CLI running)
- [ ] Webhook secret copied
- [ ] Supabase Service Role Key copied
- [ ] Database migration run successfully
- [ ] All env vars added to `.env.local`
- [ ] Dev server restarted
- [ ] Test checkout works
- [ ] Webhook events received
- [ ] `is_pro` updates in database
- [ ] Pro features unlock after payment

---

## 🎉 You're Done!

Once all steps are complete, your Stripe integration is live and ready to accept payments!

**Next:** Test the full flow end-to-end, then deploy to production.

---

**Questions?** Check the code:
- Checkout: `app/api/stripe/checkout/route.ts`
- Webhook: `app/api/stripe/webhook/route.ts`
- Portal: `app/api/stripe/portal/route.ts`
- Upgrade page: `app/(public)/upgrade/page.tsx`

