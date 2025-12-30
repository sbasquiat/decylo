# Pre-Launch Checklist - Decylo Platform

**Date:** December 2024  
**Status:** Final Pre-Launch Review

---

## 🎯 Critical Pre-Launch Tasks

### **1. Database Setup** ✅/❌

- [ ] **Run Base Schema**
  - [ ] Open Supabase Dashboard → SQL Editor
  - [ ] Run `supabase/schema.sql`
  - [ ] Verify all tables created

- [ ] **Run All Migrations**
  - [ ] `migration_subscriptions.sql` - Stripe fields
  - [ ] `migration_commit_enhancements.sql` - Commit page fields
  - [ ] `migration_self_reflection.sql` - Self-reflection field
  - [ ] `migration_cognitive_gaps.sql` - Temporal anchor, counterfactual
  - [ ] `migration_decision_health.sql` - Health snapshots
  - [ ] `migration_outcome_model.sql` - Outcome model
  - [ ] All other migration files in order

- [ ] **Apply RLS Policies** ⚠️ **CRITICAL**
  - [ ] Run `supabase/rls_policies_comprehensive.sql`
  - [ ] Verify RLS is enabled: 
    ```sql
    SELECT tablename, rowsecurity FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'decisions', 'options', 'outcomes', 'checkins', 'decision_health_snapshots');
    ```
  - [ ] Verify policies exist:
    ```sql
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
    ```

- [ ] **Verify Triggers**
  - [ ] Check `on_auth_user_created` trigger exists
  - [ ] Check `handle_new_user` function exists
  - [ ] Test: Create a new user, verify profile is auto-created

---

### **2. Stripe Configuration** ✅/❌

- [ ] **Stripe Account**
  - [ ] Account created and verified
  - [ ] **Switch to Live Mode** (if not already)
  - [ ] Business information completed

- [ ] **Products & Prices**
  - [ ] Product "Decylo Pro" created in **Live Mode**
  - [ ] Monthly price: €10/month → Copy Price ID
  - [ ] Yearly price: €89/year → Copy Price ID
  - [ ] Verify prices match your `.env.local` values

- [ ] **API Keys**
  - [ ] Get **Live** Secret Key (`sk_live_...`)
  - [ ] Update `STRIPE_SECRET_KEY` in production environment

- [ ] **Webhook Configuration**
  - [ ] Create webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
  - [ ] Select events:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - [ ] Copy **Live** webhook signing secret (`whsec_...`)
  - [ ] Update `STRIPE_WEBHOOK_SECRET` in production environment

- [ ] **Test Stripe Integration**
  - [ ] Test checkout flow with real card (refund immediately)
  - [ ] Verify webhook receives events
  - [ ] Verify `is_pro` updates in database
  - [ ] Test customer portal access
  - [ ] Test subscription cancellation

---

### **3. Environment Variables** ✅/❌

**Production Environment Variables Needed:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://btakdqkwodvsoyrmkokp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ⚠️ Keep secret!

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...  # ⚠️ Live key, not test!
STRIPE_WEBHOOK_SECRET=whsec_...  # ⚠️ Live webhook secret
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...  # Live price ID
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...  # Live price ID
```

- [ ] **Set in Hosting Platform** (Vercel, etc.)
  - [ ] Add all environment variables
  - [ ] Use **LIVE** Stripe keys (not test)
  - [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set
  - [ ] Verify all `NEXT_PUBLIC_*` variables are set

- [ ] **Verify No Test Keys in Production**
  - [ ] No `sk_test_` keys
  - [ ] No test price IDs
  - [ ] No test webhook secrets

---

### **4. Hosting & Domain** ✅/❌

- [ ] **Choose Hosting Platform**
  - [ ] Vercel (recommended for Next.js)
  - [ ] Netlify
  - [ ] AWS Amplify
  - [ ] Other

- [ ] **Domain Configuration**
  - [ ] Domain purchased/configured
  - [ ] DNS records set up
  - [ ] SSL certificate (automatic with most hosts)
  - [ ] Custom domain connected to hosting

- [ ] **Deploy Application**
  - [ ] Connect repository to hosting platform
  - [ ] Configure build settings
  - [ ] Set environment variables
  - [ ] Deploy to production
  - [ ] Verify deployment successful

- [ ] **Verify Deployment**
  - [ ] Site loads at custom domain
  - [ ] HTTPS enabled
  - [ ] All pages accessible
  - [ ] No console errors

---

### **5. Security Verification** ✅/❌

- [ ] **RLS Policies Applied**
  - [ ] Run verification queries
  - [ ] Test: Sign in as User A, try to access User B's data
  - [ ] Should fail/return empty

- [ ] **Security Headers**
  - [ ] Deploy and check headers:
    ```bash
    curl -I https://yourdomain.com | grep -E "(X-Frame|X-Content|CSP|Referrer)"
    ```
  - [ ] Verify all security headers present

- [ ] **Environment Variables Security**
  - [ ] `.env.local` in `.gitignore` ✅
  - [ ] No secrets in code
  - [ ] No secrets in repository
  - [ ] Service role key only in server-side code

- [ ] **Rate Limiting**
  - [ ] Verify rate limiting works
  - [ ] Test: Make 6 requests to `/api/stripe/checkout` in 1 minute
  - [ ] Should get 429 error on 6th request

---

### **6. Testing** ✅/❌

- [ ] **End-to-End Testing**
  - [ ] Sign up new user
  - [ ] Complete onboarding flow
  - [ ] Create a decision (all 4 steps)
  - [ ] Log an outcome
  - [ ] View insights
  - [ ] View timeline
  - [ ] Test Pro upgrade flow
  - [ ] Test Pro features unlock
  - [ ] Test export (CSV + PDF)
  - [ ] Test weekly review

- [ ] **Payment Testing**
  - [ ] Test checkout with real card (refund immediately)
  - [ ] Verify subscription created in Stripe
  - [ ] Verify `is_pro` updates in database
  - [ ] Test customer portal
  - [ ] Test subscription cancellation
  - [ ] Verify `is_pro` reverts to false

- [ ] **Error Scenarios**
  - [ ] Test with invalid data
  - [ ] Test with network failure
  - [ ] Test with expired session
  - [ ] Verify error messages are user-friendly

- [ ] **Mobile Testing**
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
  - [ ] Test responsive design
  - [ ] Test PWA installation

---

### **7. Monitoring & Logging** ✅/❌

- [ ] **Error Tracking** (Recommended)
  - [ ] Set up Sentry account
  - [ ] Install Sentry SDK
  - [ ] Configure error tracking
  - [ ] Test error reporting

- [ ] **Analytics** (Optional)
  - [ ] Set up Google Analytics or Plausible
  - [ ] Configure event tracking
  - [ ] Test analytics events

- [ ] **Uptime Monitoring**
  - [ ] Set up UptimeRobot or Pingdom
  - [ ] Monitor main pages
  - [ ] Set up alerts

- [ ] **Logging Service** (Optional)
  - [ ] Configure production logging
  - [ ] Set up log aggregation
  - [ ] Configure alerts for critical errors

---

### **8. Legal & Compliance** ✅/❌

- [ ] **Privacy Policy**
  - [ ] Review `/privacy` page
  - [ ] Ensure it's accurate
  - [ ] Update if needed

- [ ] **Terms of Service**
  - [ ] Review `/terms` page
  - [ ] Ensure it's accurate
  - [ ] Update if needed

- [ ] **GDPR Compliance** (if EU users)
  - [ ] Privacy policy accessible
  - [ ] Data export functionality (✅ implemented)
  - [ ] Data deletion process
  - [ ] Cookie consent (if needed)

- [ ] **Email Compliance**
  - [ ] Unsubscribe links in emails (when implemented)
  - [ ] Sender information
  - [ ] CAN-SPAM compliance (if US users)

---

### **9. Content & Copy** ✅/❌

- [ ] **Review All Public Pages**
  - [ ] Landing page copy
  - [ ] Pricing page
  - [ ] Upgrade page
  - [ ] Guide page
  - [ ] About page
  - [ ] FAQ page

- [ ] **Review All App Pages**
  - [ ] Onboarding flow text
  - [ ] Decision creation prompts
  - [ ] Outcome logging prompts
  - [ ] Insights explanations
  - [ ] Weekly review content

- [ ] **Verify No Placeholder Text**
  - [ ] No "Lorem ipsum"
  - [ ] No "TODO" comments visible to users
  - [ ] All copy is final

---

### **10. Performance** ✅/❌

- [ ] **Build Production Bundle**
  ```bash
  npm run build
  ```
  - [ ] Verify build succeeds
  - [ ] Check bundle size
  - [ ] No build warnings

- [ ] **Performance Testing**
  - [ ] Test page load times
  - [ ] Test on slow 3G connection
  - [ ] Test with many decisions (if possible)
  - [ ] Check Lighthouse scores

- [ ] **Database Performance**
  - [ ] Verify indexes are created
  - [ ] Test query performance
  - [ ] Monitor slow queries (if possible)

---

### **11. Backup & Recovery** ✅/❌

- [ ] **Database Backups**
  - [ ] Verify Supabase automatic backups enabled
  - [ ] Test backup restoration (if possible)
  - [ ] Document backup schedule

- [ ] **Code Backup**
  - [ ] Repository is backed up (GitHub, etc.)
  - [ ] Tag release version
  - [ ] Document rollback procedure

- [ ] **Environment Backup**
  - [ ] Document all environment variables
  - [ ] Store securely (password manager, etc.)
  - [ ] Document deployment process

---

### **12. Documentation** ✅/❌

- [ ] **Internal Documentation**
  - [ ] Deployment process documented
  - [ ] Environment variables documented
  - [ ] Database schema documented
  - [ ] API routes documented

- [ ] **User Documentation**
  - [ ] Guide page complete (`/guide`)
  - [ ] FAQ page complete
  - [ ] Help/Support contact info

---

### **13. Support & Communication** ✅/❌

- [ ] **Support Channel**
  - [ ] Email address set up
  - [ ] Contact page configured
  - [ ] Support email monitored

- [ ] **Communication Plan**
  - [ ] Launch announcement ready
  - [ ] Social media posts ready
  - [ ] Email to early users (if applicable)

---

### **14. Final Verification** ✅/❌

- [ ] **Smoke Test Checklist**
  - [ ] Homepage loads
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] Create decision works
  - [ ] Log outcome works
  - [ ] View insights works
  - [ ] Upgrade to Pro works
  - [ ] Pro features unlock
  - [ ] Export works
  - [ ] Settings accessible

- [ ] **Security Checklist**
  - [ ] RLS policies applied
  - [ ] Security headers present
  - [ ] Rate limiting works
  - [ ] No data leakage
  - [ ] HTTPS enforced

- [ ] **Payment Checklist**
  - [ ] Checkout works
  - [ ] Webhook receives events
  - [ ] Subscription activates
  - [ ] Customer portal works
  - [ ] Cancellation works

---

## 🚨 Critical Items (Must Do Before Launch)

1. ⚠️ **Apply RLS Policies** - Run `rls_policies_comprehensive.sql`
2. ⚠️ **Switch Stripe to Live Mode** - Get live keys
3. ⚠️ **Set Production Environment Variables** - All keys configured
4. ⚠️ **Test Payment Flow** - Verify checkout works end-to-end
5. ⚠️ **Verify Security Headers** - Check headers are present
6. ⚠️ **Test Data Isolation** - Verify users can't see each other's data

---

## 📋 Quick Launch Checklist

**Minimum Viable Launch:**
- [ ] RLS policies applied
- [ ] Stripe live keys configured
- [ ] Production environment variables set
- [ ] Site deployed and accessible
- [ ] Payment flow tested
- [ ] Security verified
- [ ] Basic smoke tests passed

**Everything Else:**
- Can be done post-launch
- Monitoring can be added later
- Analytics can be added later
- Legal pages can be updated as needed

---

## 🎯 Launch Day Checklist

**Morning of Launch:**
- [ ] Final smoke test
- [ ] Check error logs
- [ ] Verify Stripe dashboard
- [ ] Check Supabase dashboard
- [ ] Monitor for issues

**During Launch:**
- [ ] Monitor error tracking
- [ ] Watch for user signups
- [ ] Monitor payment processing
- [ ] Check server performance

**Post-Launch:**
- [ ] Monitor for 24-48 hours
- [ ] Respond to user feedback
- [ ] Fix any critical issues
- [ ] Celebrate! 🎉

---

## 🆘 Rollback Plan

**If Critical Issue Found:**

1. **Immediate Actions:**
   - [ ] Identify the issue
   - [ ] Assess severity
   - [ ] Decide: fix or rollback

2. **Rollback Steps:**
   - [ ] Revert to previous deployment
   - [ ] Or disable affected feature
   - [ ] Communicate to users if needed

3. **Fix & Redeploy:**
   - [ ] Fix issue in code
   - [ ] Test fix
   - [ ] Redeploy
   - [ ] Verify fix works

---

## ✅ Pre-Launch Sign-Off

**Before going live, verify:**

- [ ] All critical items completed
- [ ] Payment flow tested and working
- [ ] Security verified (RLS, headers)
- [ ] No critical bugs
- [ ] Site is accessible
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Ready to accept real users

**If all checked: ✅ READY TO LAUNCH! 🚀**

---

**Last Updated:** December 2024  
**Next Review:** Before launch

