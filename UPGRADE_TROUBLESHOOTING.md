# Upgrade to Pro Troubleshooting Guide

## Issue: User upgraded but nothing happened

### Quick Checks

1. **Check if webhook is configured in Stripe**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Verify webhook endpoint: `https://decylo.com/api/stripe/webhook`
   - Check if webhook secret matches `STRIPE_WEBHOOK_SECRET` in environment variables
   - Ensure webhook is **enabled** (not disabled)

2. **Check database columns exist**
   Run this in Supabase SQL editor:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('is_pro', 'stripe_customer_id', 'stripe_subscription_status');
   ```
   
   If columns don't exist, run: `supabase/migration_subscriptions.sql`

3. **Check webhook events in Stripe**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Check "Events" tab for recent events
   - Look for `checkout.session.completed` or `customer.subscription.created`
   - Check if events show "Succeeded" or "Failed"

4. **Check user's profile in database**
   ```sql
   SELECT id, is_pro, stripe_customer_id, stripe_subscription_status 
   FROM profiles 
   WHERE id = '<user_id>';
   ```

5. **Check Vercel logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter for `/api/stripe/webhook`
   - Look for errors or "upgrade_completed" logs

### Common Issues

#### Issue 1: Webhook not receiving events
**Symptoms:** No events in Stripe webhook logs
**Solution:**
- Verify webhook URL is correct in Stripe
- Check webhook is enabled
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

#### Issue 2: Webhook secret mismatch
**Symptoms:** "Webhook signature verification failed" in logs
**Solution:**
- Get webhook signing secret from Stripe Dashboard
- Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
- Redeploy

#### Issue 3: Database columns missing
**Symptoms:** Webhook errors about missing columns
**Solution:**
- Run `supabase/migration_subscriptions.sql` in Supabase SQL editor

#### Issue 4: Webhook succeeds but user not updated
**Symptoms:** Webhook logs show success but `is_pro` is still false
**Solution:**
- Check if `userId` is correctly passed in checkout session metadata
- Verify service role key has permissions
- Check RLS policies allow updates

### Manual Fix

If webhook failed, you can manually update the user:

```sql
UPDATE profiles 
SET 
  is_pro = true,
  stripe_subscription_status = 'active',
  stripe_customer_id = '<customer_id>'
WHERE id = '<user_id>';
```

### Testing the Webhook

1. **Test locally with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

2. **Check webhook logs:**
   - Look for "upgrade_completed" log
   - Check for any error messages
   - Verify email was sent (check Resend dashboard)

### Success Indicators

After successful upgrade:
- ✅ `is_pro` = `true` in profiles table
- ✅ `stripe_subscription_status` = `'active'` or `'trialing'`
- ✅ `stripe_customer_id` is set
- ✅ Upgrade receipt email sent (check Resend dashboard)
- ✅ Settings page shows "Pro (€10/month)"
- ✅ Success message appears on settings page after redirect

