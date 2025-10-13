-- FIXED: RLS Performance Optimization for tracking_events table
-- Run this in your Supabase SQL editor to fix the performance warnings

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Only admins can read tracking data" ON tracking_events;
DROP POLICY IF EXISTS "Only admins can delete tracking data" ON tracking_events;

-- Create optimized policies that cache auth.jwt() calls
-- This prevents re-evaluating auth.jwt() for every row

-- 1. OPTIMIZED: Admin read policy with cached auth call
CREATE POLICY "Only admins can read tracking data" ON tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.twitch_user_id = (SELECT auth.jwt() ->> 'sub')
        AND admins.twitch_user_id IS NOT NULL
    )
  );

-- 2. OPTIMIZED: Admin delete policy with cached auth call  
CREATE POLICY "Only admins can delete tracking data" ON tracking_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.twitch_user_id = (SELECT auth.jwt() ->> 'sub')
        AND admins.twitch_user_id IS NOT NULL
    )
  );

-- Verify the policies are created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracking_events'
  AND policyname IN (
    'Only admins can read tracking data',
    'Only admins can delete tracking data'
  );
