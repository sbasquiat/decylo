-- Database Setup Check Script
-- Run this in your Supabase SQL Editor to verify your database is set up correctly

-- 1. Check if the trigger exists to auto-create profiles
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check if the handle_new_user function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. List all profiles (to see if any exist)
SELECT 
  id,
  display_name,
  timezone,
  created_at,
  is_pro
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check RLS policies on decisions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'decisions'
ORDER BY policyname;

-- 5. Check if RLS is enabled on decisions table
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'decisions';

-- 6. Count decisions by user (if any exist)
SELECT 
  user_id,
  COUNT(*) as decision_count,
  MIN(created_at) as first_decision,
  MAX(created_at) as last_decision
FROM decisions
GROUP BY user_id
ORDER BY decision_count DESC;

-- 7. Check for any recent decisions
SELECT 
  id,
  user_id,
  title,
  category,
  status,
  created_at,
  date
FROM decisions
ORDER BY created_at DESC
LIMIT 10;

-- 8. Verify foreign key constraint exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'decisions'
  AND kcu.column_name = 'user_id';


