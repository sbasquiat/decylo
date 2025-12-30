# Quick Launch Guide - Decylo

**Time to Launch: ~30 minutes** ⏱️

---

## 🚀 **5 Critical Steps to Launch**

### **Step 1: Apply RLS Policies** (2 minutes) 🔴

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/rls_policies_comprehensive.sql`
3. Copy entire contents
4. Paste and **Run**
5. ✅ Done!

**Verify:**
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'decisions', 'options', 'outcomes', 'checkins', 'decision_health_snapshots');
```
All should show `rowsecurity = true`

---

### **Step 2: Verify Database Migrations** (5 minutes) 🟡

Check these migrations are run (in Supabase SQL Editor):

- [ ] `migration_subscriptions.sql` - Stripe fields
- [ ] `migration_commit_enhancements.sql` - Commit fields
- [ ] `migration_self_reflection.sql` - Self-reflection
- [ ] `migration_decision_health.sql` - Health snapshots
- [ ] `migration_cognitive_gaps.sql` - Temporal anchor
- [ ] All other migration files

**Quick Check:**
```sql
-- Check if subscription fields exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_pro', 'stripe_customer_id', 'stripe_subscription_status');
```
Should return 3 rows.

---

### **Step 3: Verify Stripe Configuration** (5 minutes) 🔴

**Check Stripe Dashboard:**
- [ ] In **Live Mode** (not Test Mode)
- [ ] Product "Decylo Pro" exists
- [ ] Monthly price: €10/month → Price ID: `price_1SjOI0AiTIybDKIlO5WGn6RC`
- [ ] Yearly price: €89/year → Price ID: `price_1SjOJQAiTIybDKIl3VpsfCcG`
- [ ] Webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Webhook secret: `whsec_MbIFk1bzlqV3sMF7cKV1TWbvgjmH7x9F`

**Your Current Keys:**
- ✅ Secret Key: `sk_live_51R33Th...` (Live - Good!)
- ✅ Webhook Secret: `whsec_MbIFk1bzlqV3sMF7cKV1TWbvgjmH7x9F` (Set)
- ✅ Price IDs: Set in `.env.local`

---

### **Step 4: Set Production Environment Variables** (5 minutes) 🔴

**If deploying to Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these (use **LIVE** Stripe keys):

```env
NEXT_PUBLIC_SUPABASE_URL=https://btakdqkwodvsoyrmkokp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
STRIPE_SECRET_KEY=sk_live_51R33Th...
STRIPE_WEBHOOK_SECRET=whsec_MbIFk1bzlqV3sMF7cKV1TWbvgjmH7x9F
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1SjOI0AiTIybDKIlO5WGn6RC
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_1SjOJQAiTIybDKIl3VpsfCcG
```

3. **Important:** Set for **Production** environment
4. Redeploy after adding variables

---

### **Step 5: Deploy & Test** (15 minutes) 🔴

**Deploy:**
1. Push code to repository
2. Connect to Vercel (or your hosting)
3. Deploy
4. Wait for build to complete

**Test:**
1. ✅ Site loads at your domain
2. ✅ Sign up works
3. ✅ Create decision works
4. ✅ Log outcome works
5. ✅ **Test Pro upgrade** (use real card, refund immediately)
6. ✅ Verify `is_pro` updates in Supabase
7. ✅ Test Pro features unlock

---

## ✅ **Pre-Launch Verification**

Run this quick test:

```bash
# 1. Check security headers
curl -I https://yourdomain.com | grep -E "(X-Frame|CSP|Referrer)"

# 2. Check site loads
curl https://yourdomain.com

# 3. Test API (should require auth)
curl https://yourdomain.com/api/stripe/checkout
# Should return 401 Unauthorized (good!)
```

---

## 🎯 **Launch Checklist**

**Before announcing launch:**

- [ ] RLS policies applied ✅
- [ ] Migrations run ✅
- [ ] Production env vars set ✅
- [ ] Site deployed ✅
- [ ] Payment tested (real card, refunded) ✅
- [ ] Security verified ✅
- [ ] No critical errors ✅

**If all checked: 🚀 LAUNCH!**

---

## 🆘 **Quick Troubleshooting**

**Issue: "RLS policy violation"**
→ Run `rls_policies_comprehensive.sql`

**Issue: "Stripe checkout fails"**
→ Check Live keys are set in production env vars

**Issue: "Users see each other's data"**
→ Verify RLS policies are applied

**Issue: "Site won't load"**
→ Check environment variables are set
→ Check build logs for errors

---

## 📞 **Support**

If you encounter issues:
1. Check error logs in hosting platform
2. Check Supabase logs
3. Check Stripe dashboard for webhook events
4. Review `PRE_LAUNCH_CHECKLIST.md` for detailed steps

---

**You're ready! Good luck with the launch! 🚀**

