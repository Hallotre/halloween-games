-- Create secure analytics tables instead of views
-- This allows us to have proper RLS policies

-- Create a secure event_summary table
CREATE TABLE IF NOT EXISTS secure_event_summary (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  avg_events_per_user DECIMAL(10,2) DEFAULT 0,
  last_24h_count INTEGER DEFAULT 0,
  last_7d_count INTEGER DEFAULT 0,
  suspicious_events INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a secure daily_activity_summary table
CREATE TABLE IF NOT EXISTS secure_daily_activity_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_events INTEGER DEFAULT 0,
  daily_active_users INTEGER DEFAULT 0,
  daily_sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  searches INTEGER DEFAULT 0,
  game_submissions INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  sorting_changes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the tables
ALTER TABLE secure_event_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_daily_activity_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure_event_summary
CREATE POLICY "Only admins can read event summary"
  ON secure_event_summary
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

CREATE POLICY "Only admins can insert event summary"
  ON secure_event_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

CREATE POLICY "Only admins can update event summary"
  ON secure_event_summary
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

-- Create RLS policies for secure_daily_activity_summary
CREATE POLICY "Only admins can read daily activity"
  ON secure_daily_activity_summary
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

CREATE POLICY "Only admins can insert daily activity"
  ON secure_daily_activity_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

CREATE POLICY "Only admins can update daily activity"
  ON secure_daily_activity_summary
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT twitch_user_id FROM admins
    )
  );

-- Create a function to refresh the secure analytics tables
CREATE OR REPLACE FUNCTION refresh_secure_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Clear and refresh event summary
  DELETE FROM secure_event_summary;
  
  INSERT INTO secure_event_summary (
    event_type, count, unique_users, sessions, unique_sessions,
    avg_events_per_user, last_24h_count, last_7d_count,
    suspicious_events, last_updated
  )
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
  GROUP BY event_type
  ORDER BY count DESC;

  -- Clear and refresh daily activity summary
  DELETE FROM secure_daily_activity_summary;
  
  INSERT INTO secure_daily_activity_summary (
    date, total_events, daily_active_users, daily_sessions,
    page_views, votes, searches, game_submissions,
    tab_switches, sorting_changes
  )
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
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- Create trigger to auto-refresh analytics when tracking_events changes
CREATE OR REPLACE FUNCTION trigger_refresh_secure_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Refresh analytics in the background
  PERFORM refresh_secure_analytics();
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_refresh_secure_analytics ON tracking_events;

-- Create the trigger
CREATE TRIGGER trigger_refresh_secure_analytics
  AFTER INSERT OR UPDATE OR DELETE ON tracking_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_secure_analytics();

-- Initial refresh
SELECT refresh_secure_analytics();

-- Grant permissions
GRANT SELECT ON secure_event_summary TO authenticated;
GRANT SELECT ON secure_daily_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_secure_analytics() TO authenticated;
