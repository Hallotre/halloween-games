-- Secure tracking solution with RLS enabled
-- This approach uses a service role for inserts and proper RLS for reads

-- First, re-enable RLS
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all inserts" ON tracking_events;
DROP POLICY IF EXISTS "Allow all selects" ON tracking_events;

-- Create a policy that allows inserts only from service role
-- (This will be handled by your application using the service key)
CREATE POLICY "Service role can insert tracking events"
  ON tracking_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create a policy that allows admins to read tracking events
-- We'll use a simpler approach that doesn't cause recursion
CREATE POLICY "Admins can read tracking events"
  ON tracking_events
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user is in the admins table
    -- Using a simpler approach to avoid recursion
    auth.uid() IN (
      SELECT auth.uid() 
      FROM admins 
      WHERE admins.twitch_user_id = auth.uid()::text
      LIMIT 1
    )
  );

-- Alternative: If the above still causes issues, use this simpler version
-- DROP POLICY IF EXISTS "Admins can read tracking events" ON tracking_events;
-- CREATE POLICY "Authenticated users can read tracking events"
--   ON tracking_events
--   FOR SELECT
--   TO authenticated
--   USING (true);
