# Decylo Monetization Implementation

## ✅ Implementation Complete

Stripe subscription monetization has been implemented with paywalls for free tier limitations.

## Database Schema

**Migration:** `supabase/migration_subscriptions.sql`

Adds to `profiles` table:
- `is_pro` (boolean) - Source of truth for Pro status
- `stripe_customer_id` (text) - Stripe customer ID
- `stripe_subscription_status` (text) - Subscription status from Stripe
- `updated_at` (timestamp) - Auto-updated timestamp

## Stripe Integration

### API Routes

1. **`/api/stripe/checkout`** (POST)
   - Creates Stripe Checkout session
   - Creates customer if doesn't exist
   - Returns checkout URL

2. **`/api/stripe/portal`** (GET)
   - Creates Stripe Customer Portal session
   - Allows users to manage/cancel subscriptions

3. **`/api/stripe/webhook`** (POST)
   - Handles Stripe webhook events
   - Updates `is_pro` and subscription status in Supabase
   - Events handled:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### Webhook Logic

- Sets `is_pro = true` when subscription status is `'active'` or `'trialing'`
- Sets `is_pro = false` when subscription is canceled or deleted
- Uses Supabase service role key to bypass RLS

## Paywall Implementation

### Gated Features

1. **Timeline History** (Hard Paywall)
   - Free: Last 7 days only
   - Pro: Unlimited history
   - Shows paywall modal when trying to view/access decisions older than 7 days

2. **Advanced Insights** (Soft Paywall)
   - Free: Basic stats (Win Rate, Streak, Total Decisions)
   - Pro: Decision Health metrics (DQI, Growth Rate, Calibration, Category Intelligence)
   - Locked sections show blur + upgrade prompt

3. **Export** (Hard Paywall)
   - Free: Blocked
   - Pro: CSV export available
   - Shows paywall modal on export attempt

### Paywall Components

- **`PaywallModal`** - Reusable modal with upgrade CTA
- **`InsightsLock`** - Wrapper for locked insights sections
- **`TimelineClient`** - Client component handling timeline paywall logic

## UI Updates

### Pricing Page (`/pricing`)
- "Upgrade to Pro" button → Creates checkout session (monthly)
- "Get Pro Annual" button → Creates checkout session (yearly)
- Uses environment variables for price IDs

### Settings Page (`/app/settings`)
- Shows current plan status (Free/Pro)
- "Manage Subscription" button (Pro users only) → Opens Stripe Portal
- "Upgrade to Pro" button (Free users) → Links to pricing
- Export button gated (shows paywall for free users)

### Insights Page (`/app/insights`)
- Decision Health section locked for free users
- Category Intelligence locked for free users
- Basic stats (Win Rate, Streak) remain visible

### Timeline Page (`/app/timeline`)
- Filters decisions to last 7 days for free users
- Shows paywall when trying to access older decisions
- Blurs locked content

## Helper Functions

### `lib/subscription.ts`
- `getUserPlan()` - Server-side helper to get user's plan status
- `isWithinFreeTier()` - Checks if date is within 7-day free limit

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...

# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## Setup Steps

1. **Run Database Migration**
   ```sql
   -- Run supabase/migration_subscriptions.sql in Supabase SQL editor
   ```

2. **Create Stripe Products & Prices**
   - Create "Decylo Pro" product
   - Add monthly price: €10/month
   - Add yearly price: €96/year
   - Copy Price IDs to `.env.local`

3. **Set Up Stripe Webhook**
   - Dashboard → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook secret to `.env.local`

4. **Get Supabase Service Role Key**
   - Supabase Dashboard → Settings → API
   - Copy "service_role" key (keep secret!)
   - Add to `.env.local`

5. **Test Flow**
   - Sign up as new user
   - Try to access timeline beyond 7 days → Paywall
   - Try to view advanced insights → Locked
   - Try to export → Paywall
   - Go to pricing → Click "Upgrade to Pro"
   - Complete checkout → Verify `is_pro = true` in Supabase
   - Test portal access in settings

## Analytics Events

Logged to console (can be extended to analytics service):
- `paywall_shown { reason: "history"|"insights"|"export" }`
- `upgrade_started`
- `upgrade_completed`

## Core Loop Protection

✅ **NOT Gated (Remains Free):**
- Creating decisions
- Scoring options
- Committing to decisions
- Logging outcomes
- Basic insights (Win Rate, Streak)

✅ **Gated (Pro Only):**
- History beyond 7 days
- Advanced insights (DQI, Growth, Calibration, Category Intelligence)
- Export functionality

## Next Steps

1. Set up Stripe account and create products
2. Configure webhook endpoint
3. Add environment variables
4. Run database migration
5. Test end-to-end flow
6. Monitor webhook events in Stripe Dashboard

## Files Created/Modified

**New Files:**
- `supabase/migration_subscriptions.sql`
- `lib/subscription.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/portal/route.ts`
- `app/api/stripe/webhook/route.ts`
- `components/PaywallModal.tsx`
- `components/InsightsLock.tsx`
- `components/TimelineClient.tsx`
- `STRIPE_SETUP.md`
- `MONETIZATION_IMPLEMENTATION.md`

**Modified Files:**
- `app/app/timeline/page.tsx` - Added paywall logic
- `app/app/insights/page.tsx` - Added locked sections
- `app/app/settings/page.tsx` - Added subscription management
- `app/(public)/pricing/page.tsx` - Added checkout buttons
- `components/ui/Button.tsx` - Added PrimaryButton/SecondaryButton exports


