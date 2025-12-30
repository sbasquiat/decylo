# Security Implementation Guide

## ✅ What's Been Implemented

### 1. Security Headers (next.config.js)

Added comprehensive security headers to protect against common web vulnerabilities:

- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Restricts browser features (camera, mic, geolocation)
- **Content-Security-Policy (CSP)** - Restricts resource loading to trusted sources
  - Allows: self, Stripe, Supabase
  - Blocks: inline scripts (except necessary for Next.js)
  - Blocks: external scripts except Stripe
- **Cache-Control** - Prevents caching of authenticated content

### 2. Row Level Security (RLS) Policies

Created comprehensive RLS policies for all tables:

- **profiles** - User isolation + service role for webhooks
- **decisions** - Strict user ownership
- **options** - Ownership verified through decisions table
- **outcomes** - Ownership verified through decisions table
- **checkins** - User isolation
- **decision_health_snapshots** - User isolation

## 🚀 How to Apply

### Step 1: Security Headers (Already Applied)

The security headers are already in `next.config.js`. Just restart your dev server:

```bash
npm run dev
```

### Step 2: Apply RLS Policies

1. **Go to Supabase Dashboard** → **SQL Editor**

2. **Open the file**: `supabase/rls_policies_comprehensive.sql`

3. **Copy the entire contents** and paste into SQL Editor

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify success** - You should see:
   - "Success. No rows returned"
   - Or confirmation messages for each policy

6. **Verify RLS is enabled** (optional):
   ```sql
   SELECT tablename, rowsecurity as rls_enabled
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('profiles', 'decisions', 'options', 'outcomes', 'checkins', 'decision_health_snapshots')
   ORDER BY tablename;
   ```

## 🔒 Security Coverage

### OWASP Top 10 Protection

| OWASP Risk | Protection | Status |
|------------|------------|--------|
| **A01: Broken Access Control** | RLS policies enforce user isolation | ✅ Protected |
| **A02: Cryptographic Failures** | Supabase handles encryption, HTTPS required | ✅ Protected |
| **A03: Injection** | Parameterized queries via Supabase client | ✅ Protected |
| **A04: Insecure Design** | Session refresh in middleware, defensive queries | ✅ Protected |
| **A05: Security Misconfiguration** | Security headers, RLS enabled | ✅ Protected |
| **A06: Vulnerable Components** | Keep dependencies updated (`npm audit`) | ⚠️ Monitor |
| **A07: Authentication Failures** | Supabase Auth handles this | ✅ Protected |
| **A08: Software/Data Integrity** | CSP prevents untrusted scripts | ✅ Protected |
| **A09: Logging/Monitoring** | Add logging for security events | ⚠️ Recommended |
| **A10: SSRF** | No external URL fetching in server code | ✅ Protected |

## 🧪 Testing Security

### Test 1: Verify RLS is Working

1. Sign in as User A
2. Create a decision
3. Sign out
4. Sign in as User B
5. Try to access User A's decision via direct URL
6. **Expected**: Should not see User A's data

### Test 2: Verify Security Headers

1. Open browser DevTools → Network tab
2. Load any page
3. Check Response Headers
4. **Expected**: Should see all security headers

### Test 3: Test CSP

1. Open browser DevTools → Console
2. Try to load external script: `eval('alert("test")')`
3. **Expected**: Should be blocked by CSP

## ⚠️ Important Notes

### Service Role Key

- The **service role key** (used in `/api/stripe/webhook`) **bypasses RLS**
- This is intentional - webhooks need to update subscription status
- **Never expose the service role key** to client-side code
- Only use it in server-side API routes

### CSP Adjustments

If you encounter issues with:
- **Stripe checkout** - Already allowed in CSP
- **Supabase realtime** - Already allowed in CSP
- **Third-party analytics** - Add to CSP if needed

To adjust CSP, edit `next.config.js` → `Content-Security-Policy` header.

### Monitoring

Consider adding:
- **Error logging** for failed auth attempts
- **Rate limiting** on auth endpoints
- **Audit logging** for sensitive operations (subscription changes, data exports)

## 📋 Checklist

- [x] Security headers added to next.config.js
- [x] RLS policies created for all tables
- [ ] RLS policies applied in Supabase (run the SQL file)
- [ ] Tested user isolation (User A cannot see User B's data)
- [ ] Verified security headers in browser DevTools
- [ ] Tested Stripe checkout still works
- [ ] Tested webhook updates still work

## 🔗 Related Files

- `next.config.js` - Security headers configuration
- `supabase/rls_policies_comprehensive.sql` - Complete RLS policies
- `lib/supabase/middleware.ts` - Session refresh logic
- `app/api/stripe/webhook/route.ts` - Uses service role key

## 🆘 Troubleshooting

### Issue: "Policy violation" errors

**Solution**: Check that RLS policies are applied correctly. Run the verification queries in the SQL file.

### Issue: Webhook can't update profiles

**Solution**: Service role key should bypass RLS. Check that you're using `SUPABASE_SERVICE_ROLE_KEY` in the webhook route.

### Issue: CSP blocking legitimate scripts

**Solution**: Adjust CSP in `next.config.js`. Add the domain to the appropriate directive.

### Issue: Users can see other users' data

**Solution**: 
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
2. Check policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
3. Re-run the RLS policies SQL file

---

**Security is an ongoing process.** Keep dependencies updated and monitor for new vulnerabilities.

