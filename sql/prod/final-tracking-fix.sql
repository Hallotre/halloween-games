-- Final fix for tracking policies - remove the potentially problematic admin delete policy
-- and replace with a simpler approach

-- Drop the admin delete policy that uses auth.uid()
DROP POLICY IF EXISTS "Admins can delete" ON tracking_events;

-- Create a simpler delete policy that doesn't use auth.uid()
-- This will be handled by your application layer instead
CREATE POLICY "No deletes allowed"
  ON tracking_events
  FOR DELETE
  TO public
  USING (false);

-- Verify the final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tracking_events'
ORDER BY cmd, policyname;
