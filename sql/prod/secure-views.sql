-- Add RLS policies to secure the analytics views
-- This ensures only authenticated users can access the analytics data

-- Enable RLS on the views (they inherit from tracking_events)
-- First, let's check if the views need explicit RLS policies

-- Create policies for event_summary view
-- (Views inherit RLS from their underlying tables, but let's be explicit)

-- Create a policy for authenticated users to read event_summary
CREATE POLICY "Authenticated users can read event_summary"
  ON event_summary
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for daily_activity_summary
CREATE POLICY "Authenticated users can read daily_activity_summary"
  ON daily_activity_summary
  FOR SELECT
  TO authenticated
  USING (true);

-- If you want to restrict to admins only, use this instead:
-- DROP POLICY IF EXISTS "Authenticated users can read event_summary" ON event_summary;
-- DROP POLICY IF EXISTS "Authenticated users can read daily_activity_summary" ON daily_activity_summary;

-- CREATE POLICY "Admins can read event_summary"
--   ON event_summary
--   FOR SELECT
--   TO authenticated
--   USING (
--     auth.uid()::text IN (
--       SELECT twitch_user_id FROM admins
--     )
--   );

-- CREATE POLICY "Admins can read daily_activity_summary"
--   ON daily_activity_summary
--   FOR SELECT
--   TO authenticated
--   USING (
--     auth.uid()::text IN (
--       SELECT twitch_user_id FROM admins
--     )
--   );

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('event_summary', 'daily_activity_summary')
ORDER BY tablename, policyname;
