-- Create Missing Profiles for Existing Users
-- Run this if you have existing users but no profiles
-- This will create profiles for all users that don't have one

INSERT INTO public.profiles (id, display_name, timezone)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', NULL) as display_name,
  COALESCE(raw_user_meta_data->>'timezone', 'UTC') as timezone
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT 
  p.id,
  p.display_name,
  p.timezone,
  p.created_at,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;


