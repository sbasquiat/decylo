-- Diagnose Decision Storage Issue
-- Run this to check common causes of decisions not storing

-- 1. Check if you have any profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as profiles_last_7_days
FROM profiles;

-- 2. Check if you have any decisions
SELECT 
  COUNT(*) as total_decisions,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as decisions_last_7_days,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as decisions_today
FROM decisions;

-- 3. Check if profiles exist for all auth users
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  CASE WHEN p.id IS NOT NULL THEN 'Profile exists' ELSE 'MISSING PROFILE' END as profile_status,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;

-- 4. Check RLS policies on decisions table (should allow INSERT)
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'decisions'
ORDER BY cmd, policyname;

-- 5. Check if RLS is enabled (should be true)
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('decisions', 'profiles', 'options');

-- 6. Test: Count decisions by user (if any exist)
SELECT 
  d.user_id,
  COUNT(*) as decision_count,
  MIN(d.created_at) as first_decision,
  MAX(d.created_at) as last_decision
FROM decisions d
GROUP BY d.user_id
ORDER BY decision_count DESC;

-- 7. Check for any recent failed inserts (check error logs in Supabase dashboard)
-- This won't show in SQL, but check your Supabase logs for:
-- - Foreign key constraint violations
-- - RLS policy violations
-- - Check constraint violations

-- 8. Verify the handle_new_user function is correct
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';


