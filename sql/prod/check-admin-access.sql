-- Check admin access
-- First, let's see what's in the admins table
SELECT 
  'admins_table' as table_name,
  COUNT(*) as total_admins,
  string_agg(twitch_user_id, ', ') as admin_user_ids
FROM admins;

-- Check if there are any admins at all
SELECT * FROM admins ORDER BY created_at DESC;

-- Check what user ID is being used in the session
-- This will help us understand if the user is properly authenticated
SELECT 
  'current_user_check' as info,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'sub' as jwt_sub;
