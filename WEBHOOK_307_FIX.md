# Fix for Stripe Webhook 307 Redirect Error

## Problem
Stripe webhook events are failing with HTTP 307 (Temporary Redirect) errors. The response shows:
```json
{
  "redirect": "https://www.decylo.com/api/stripe/webhook",
  "status": "307"
}
```

## Root Cause
The 307 redirect is happening because:
1. **Middleware interference**: The Next.js middleware is processing the webhook request and potentially causing redirects
2. **Domain redirect**: Vercel might be redirecting `decylo.com` → `www.decylo.com` (or vice versa)

## Solution Applied

### 1. Updated Middleware (`middleware.ts`)
- Added check to skip middleware for `/api/stripe/webhook` route
- Webhook route now bypasses all middleware processing
- This prevents any redirects or session handling that could interfere

### 2. Updated Webhook Route (`app/api/stripe/webhook/route.ts`)
- Ensured webhook always returns HTTP 200 status code
- Even on errors, returns 200 to prevent Stripe retries
- Proper JSON response format

## Next Steps

### 1. Update Stripe Webhook URL
You need to ensure the webhook URL in Stripe matches the actual domain being used:

**Option A: Use www.decylo.com (if that's your canonical domain)**
- Go to Stripe Dashboard → Developers → Webhooks
- Edit your webhook endpoint
- Change URL to: `https://www.decylo.com/api/stripe/webhook`
- Save

**Option B: Use decylo.com (if that's your canonical domain)**
- Keep URL as: `https://decylo.com/api/stripe/webhook`
- Configure Vercel to not redirect www → non-www for webhook routes

### 2. Configure Vercel Domain Redirect (if needed)
If you want to prevent www/non-www redirects for the webhook:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Check if there's a redirect configured
3. If redirecting www → non-www (or vice versa), the webhook URL in Stripe must match the **final** domain (after redirect)

### 3. Test the Fix
1. Deploy the updated code to Vercel
2. In Stripe Dashboard → Webhooks → Your endpoint
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Check if it succeeds (should show 200 OK, not 307)

### 4. Resend Failed Events
After the fix is deployed:
1. Go to Stripe Dashboard → Webhooks → Your endpoint → Events
2. Find failed events (307 ERR)
3. Click "Resend" on each failed event
4. They should now succeed

## Verification

After deploying, check:
- ✅ Stripe webhook events show "Succeeded" (200 OK)
- ✅ No more 307 redirect errors
- ✅ User upgrades are processed correctly
- ✅ `is_pro` field updates in database
- ✅ Upgrade receipt emails are sent

## If Still Failing

If you still see 307 errors after deploying:

1. **Check Vercel redirects**: Go to Vercel Dashboard → Settings → Domains and check for redirect rules
2. **Check domain configuration**: Ensure the webhook URL in Stripe exactly matches your canonical domain
3. **Check Vercel logs**: Look for any redirects happening at the Vercel level
4. **Test with Stripe CLI**: `stripe listen --forward-to https://decylo.com/api/stripe/webhook` to see real-time events

