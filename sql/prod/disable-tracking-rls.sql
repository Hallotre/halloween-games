-- Disable RLS completely for tracking_events table
-- This is the simplest solution for tracking events

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Admins can read tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Authenticated users can read tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Allow all inserts" ON tracking_events;
DROP POLICY IF EXISTS "Allow all selects" ON tracking_events;

-- Disable RLS completely for tracking_events
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;

-- This will allow anyone to insert and read tracking events
-- which is what we want for analytics tracking

