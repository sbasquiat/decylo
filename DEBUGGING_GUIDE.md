# Debugging Guide: Decisions Not Storing

## What We've Verified ✅

1. **Trigger exists**: `on_auth_user_created` trigger is present
2. **Foreign key constraint**: `decisions.user_id` → `profiles.id` is set up correctly

## Next Steps to Diagnose

### Step 1: Check if Profiles Exist

Run this query in Supabase SQL Editor:

```sql
-- Check if profiles exist for your users
SELECT 
  u.id,
  u.email,
  CASE WHEN p.id IS NOT NULL THEN 'Profile exists' ELSE 'MISSING PROFILE' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

**If you see "MISSING PROFILE"**: Run `supabase/create_missing_profiles.sql` to create profiles for existing users.

### Step 2: Check Browser Console

When you try to create a decision, check the browser console (F12 → Console tab) for:

1. **"Profile not found, creating profile"** - This means the profile check is working
2. **"Decision creation error"** - This will show the exact error preventing storage

Look for error codes:
- `23503` = Foreign key violation (profile doesn't exist)
- `42501` = Permission denied (RLS blocking)
- `23514` = Check constraint violation (invalid data)

### Step 3: Check RLS Policies

Run this query:

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'decisions';
```

You should see:
- `Users can insert own decisions` with `cmd = 'INSERT'`
- `with_check` should be `auth.uid() = user_id`

### Step 4: Test with Direct Insert

Try inserting a decision directly in SQL (replace `YOUR_USER_ID` with actual UUID):

```sql
-- First, get your user ID
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- Then try inserting (replace the UUID below with your actual user ID)
INSERT INTO decisions (user_id, date, title, category, context, status)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID
  CURRENT_DATE,
  'Test Decision',
  'other',
  'This is a test',
  'open'
)
RETURNING *;
```

If this works, the issue is in the application code.
If this fails, check the error message - it will tell you what's wrong.

### Step 5: Check Application Logs

The enhanced error logging I added will show:
- Full error details
- User ID
- Decision data being inserted

Check the browser console when creating a decision.

## Common Issues & Fixes

### Issue 1: Profile Doesn't Exist
**Symptom**: Foreign key violation error (23503)
**Fix**: Run `supabase/create_missing_profiles.sql`

### Issue 2: RLS Blocking Insert
**Symptom**: Permission denied error (42501)
**Fix**: Verify RLS policies exist and are correct:
```sql
-- Recreate INSERT policy if missing
CREATE POLICY "Users can insert own decisions" ON decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Issue 3: Invalid Data
**Symptom**: Check constraint violation (23514)
**Fix**: Check that:
- `category` is one of: 'work', 'money', 'health', 'career', 'relationship', 'other'
- `status` is one of: 'open', 'decided', 'completed'
- `title` and `context` are not empty

### Issue 4: Trigger Not Firing
**Symptom**: Profile not created on signup
**Fix**: Run `supabase/fix_missing_profile_trigger.sql`

## Quick Test

1. Open browser console (F12)
2. Try to create a decision in the app
3. Look for console errors
4. Share the error message for further diagnosis


