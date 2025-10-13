-- Enhanced event summary with more detailed analytics
-- This creates a comprehensive summary table with better insights

-- First, let's enhance the event_summary table structure
-- Add more columns for better analytics
ALTER TABLE event_summary ADD COLUMN IF NOT EXISTS unique_sessions INTEGER DEFAULT 0;
ALTER TABLE event_summary ADD COLUMN IF NOT EXISTS avg_events_per_user DECIMAL(10,2) DEFAULT 0;
ALTER TABLE event_summary ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create additional summary tables for different time periods
CREATE TABLE IF NOT EXISTS event_summary_hourly (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_summary_daily (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  date_bucket DATE NOT NULL,
  count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  avg_events_per_user DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a comprehensive refresh function
CREATE OR REPLACE FUNCTION refresh_all_event_summaries()
RETURNS void AS $$
BEGIN
  -- Refresh main event_summary table
  DELETE FROM event_summary;
  
  INSERT INTO event_summary (event_type, count, unique_users, sessions, unique_sessions, avg_events_per_user, last_updated)
  SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(DISTINCT session_id) as unique_sessions,
    ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as avg_events_per_user,
    NOW() as last_updated
  FROM tracking_events
  WHERE user_id IS NOT NULL
  GROUP BY event_type
  ORDER BY count DESC;

  -- Refresh hourly summary (last 24 hours)
  DELETE FROM event_summary_hourly WHERE hour_bucket > NOW() - INTERVAL '24 hours';
  
  INSERT INTO event_summary_hourly (event_type, hour_bucket, count, unique_users, unique_sessions)
  SELECT 
    event_type,
    DATE_TRUNC('hour', created_at) as hour_bucket,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
  FROM tracking_events
  WHERE user_id IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY event_type, DATE_TRUNC('hour', created_at)
  ORDER BY hour_bucket DESC, count DESC;

  -- Refresh daily summary (last 30 days)
  DELETE FROM event_summary_daily WHERE date_bucket > CURRENT_DATE - INTERVAL '30 days';
  
  INSERT INTO event_summary_daily (event_type, date_bucket, count, unique_users, unique_sessions, avg_events_per_user)
  SELECT 
    event_type,
    DATE(created_at) as date_bucket,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as avg_events_per_user
  FROM tracking_events
  WHERE user_id IS NOT NULL
    AND created_at > CURRENT_DATE - INTERVAL '30 days'
  GROUP BY event_type, DATE(created_at)
  ORDER BY date_bucket DESC, count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create additional analytics views
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  'total_users' as metric,
  COUNT(DISTINCT user_id) as value
FROM tracking_events
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'total_sessions' as metric,
  COUNT(DISTINCT session_id) as value
FROM tracking_events
UNION ALL
SELECT 
  'total_events' as metric,
  COUNT(*) as value
FROM tracking_events
UNION ALL
SELECT 
  'avg_events_per_user' as metric,
  ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as value
FROM tracking_events
WHERE user_id IS NOT NULL;

CREATE OR REPLACE VIEW popular_pages AS
SELECT 
  page_url,
  COUNT(*) as page_views,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM tracking_events
WHERE event_type = 'page_view'
  AND page_url IS NOT NULL
GROUP BY page_url
ORDER BY page_views DESC
LIMIT 20;

CREATE OR REPLACE VIEW search_analytics AS
SELECT 
  event_data->>'query' as search_query,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_searchers,
  AVG((event_data->>'results_count')::INTEGER) as avg_results
FROM tracking_events
WHERE event_type = 'search'
  AND event_data->>'query' IS NOT NULL
GROUP BY event_data->>'query'
ORDER BY search_count DESC
LIMIT 20;

-- Create triggers to keep summaries updated
CREATE OR REPLACE FUNCTION update_all_summaries_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh all summaries when tracking_events changes
  PERFORM refresh_all_event_summaries();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_all_summaries ON tracking_events;

-- Create the trigger
CREATE TRIGGER trigger_update_all_summaries
  AFTER INSERT OR UPDATE OR DELETE ON tracking_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_all_summaries_trigger();

-- Initial refresh
SELECT refresh_all_event_summaries();

-- Grant permissions
GRANT SELECT ON event_summary TO authenticated;
GRANT SELECT ON event_summary_hourly TO authenticated;
GRANT SELECT ON event_summary_daily TO authenticated;
GRANT SELECT ON user_engagement_summary TO authenticated;
GRANT SELECT ON popular_pages TO authenticated;
GRANT SELECT ON search_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_event_summaries() TO authenticated;
