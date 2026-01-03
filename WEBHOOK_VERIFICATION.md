# Webhook Verification Checklist

## ✅ Configuration Complete

- **Webhook URL**: `https://www.decylo.com/api/stripe/webhook`
- **Middleware**: Updated to skip webhook route (prevents redirects)
- **Webhook Route**: Returns HTTP 200 OK properly

## Next Steps to Verify

### 1. Deploy the Code Changes
Make sure the updated `middleware.ts` and `app/api/stripe/webhook/route.ts` are deployed to Vercel.

### 2. Test the Webhook in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint (`https://www.decylo.com/api/stripe/webhook`)
3. Click **"Send test webhook"** button
4. Select event: `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check the response:
   - ✅ Should show **"Succeeded"** with HTTP 200
   - ❌ Should NOT show 307 redirect error

### 3. Resend Failed Events
After confirming the test works:

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Go to **"Event deliveries"** tab
3. Find events with **"307 ERR"** status
4. Click **"Resend"** on each failed event
5. They should now succeed with HTTP 200

### 4. Test a Real Upgrade
1. Create a test checkout session
2. Complete the payment (use Stripe test mode)
3. Check Stripe webhook logs - should show success
4. Verify in database:
   ```sql
   SELECT id, is_pro, stripe_subscription_status 
   FROM profiles 
   WHERE id = '<user_id>';
   ```
5. Check that `is_pro` = `true` and `stripe_subscription_status` = `'active'`

### 5. Verify Upgrade Receipt Email
- Check Resend dashboard for upgrade receipt email
- Should be sent automatically after successful webhook

## Expected Behavior After Fix

✅ **Stripe Webhook Events:**
- Status: "Succeeded" (green)
- HTTP Status: 200 OK
- Response: `{"received": true}`

✅ **User Profile:**
- `is_pro` = `true`
- `stripe_subscription_status` = `'active'` or `'trialing'`
- `stripe_customer_id` is set

✅ **User Experience:**
- Settings page shows "Pro (€10/month)"
- Success message appears after checkout redirect
- Upgrade receipt email received

## Troubleshooting

### If webhook still shows 307:
1. **Check Vercel deployment**: Make sure latest code is deployed
2. **Check middleware**: Verify `middleware.ts` has the webhook skip logic
3. **Check domain**: Ensure webhook URL exactly matches `https://www.decylo.com/api/stripe/webhook`
4. **Check Vercel logs**: Look for any redirects happening at Vercel level

### If webhook shows 200 but user not upgraded:
1. **Check Vercel logs**: Look for webhook processing errors
2. **Check database**: Verify `is_pro` column exists (run `migration_subscriptions.sql`)
3. **Check service role key**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
4. **Check webhook logs**: Look for "upgrade_completed" log message

### If upgrade receipt email not sent:
1. **Check Resend dashboard**: Verify email was sent
2. **Check email preferences**: User might have disabled emails
3. **Check email logs**: Look in `email_logs` table for entry
4. **Check Vercel logs**: Look for email sending errors

## Success Indicators

After everything is working:
- ✅ All webhook events show "Succeeded" in Stripe
- ✅ No more 307 redirect errors
- ✅ User upgrades process automatically
- ✅ Upgrade receipt emails are sent
- ✅ Settings page reflects Pro status immediately

