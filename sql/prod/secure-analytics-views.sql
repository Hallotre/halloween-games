-- Create secure analytics views with proper access control
-- This replaces the unrestricted views with admin-only versions

-- Drop the existing unrestricted views
DROP VIEW IF EXISTS event_summary;
DROP VIEW IF EXISTS daily_activity_summary;

-- Create secure event_summary view (admin-only access)
CREATE VIEW event_summary AS
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as avg_events_per_user,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d_count,
  COUNT(*) FILTER (WHERE 
    session_id IN (
      SELECT session_id 
      FROM (
        SELECT 
          session_id,
          COUNT(*) as event_count
        FROM tracking_events
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY session_id
        HAVING COUNT(*) > 20
      ) suspicious_sessions
    )
  ) as suspicious_events,
  NOW() as last_updated
FROM tracking_events
WHERE user_id IS NOT NULL
  -- Only show data if user is admin (this provides the security)
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
GROUP BY event_type
ORDER BY count DESC;

-- Create secure daily_activity_summary view (admin-only access)
CREATE VIEW daily_activity_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(DISTINCT session_id) as daily_sessions,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(*) FILTER (WHERE event_type = 'vote') as votes,
  COUNT(*) FILTER (WHERE event_type = 'search') as searches,
  COUNT(*) FILTER (WHERE event_type = 'game_submission') as game_submissions,
  COUNT(*) FILTER (WHERE event_type = 'tab_switch') as tab_switches,
  COUNT(*) FILTER (WHERE event_type = 'sorting_change') as sorting_changes
FROM tracking_events
WHERE user_id IS NOT NULL
  AND created_at > CURRENT_DATE - INTERVAL '30 days'
  -- Only show data if user is admin
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions only to authenticated users
GRANT SELECT ON event_summary TO authenticated;
GRANT SELECT ON daily_activity_summary TO authenticated;

-- Note: The views now have built-in admin checks, so they're secure
-- Only users who are in the admins table will see any data
