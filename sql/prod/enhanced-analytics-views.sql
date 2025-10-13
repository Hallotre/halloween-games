-- Enhanced Analytics Views with Comprehensive Metrics
-- Drop existing views first
DROP VIEW IF EXISTS hourly_activity_summary CASCADE;
DROP VIEW IF EXISTS weekly_activity_summary CASCADE;
DROP VIEW IF EXISTS user_behavior_metrics CASCADE;
DROP VIEW IF EXISTS performance_metrics CASCADE;
DROP VIEW IF EXISTS conversion_funnel CASCADE;
DROP VIEW IF EXISTS top_performing_content CASCADE;
DROP VIEW IF EXISTS geographic_analytics CASCADE;
DROP VIEW IF EXISTS device_analytics CASCADE;
DROP VIEW IF EXISTS session_analytics CASCADE;

-- 1. Hourly Activity Summary
CREATE VIEW hourly_activity_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
  COUNT(*) FILTER (WHERE event_type = 'vote') AS votes,
  COUNT(*) FILTER (WHERE event_type = 'search') AS searches,
  COUNT(*) FILTER (WHERE event_type = 'game_submission') AS game_submissions,
  COUNT(*) FILTER (WHERE event_type = 'tab_switch') AS tab_switches,
  COUNT(*) FILTER (WHERE event_type = 'sorting_change') AS sorting_changes,
  ROUND(AVG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('hour', created_at) ROWS BETWEEN 23 PRECEDING AND CURRENT ROW), 2) AS avg_events_24h,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS avg_events_per_session
FROM tracking_events 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 2. Weekly Activity Summary
CREATE VIEW weekly_activity_summary AS
SELECT 
  DATE_TRUNC('week', created_at) AS week_start,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
  COUNT(*) FILTER (WHERE event_type = 'vote') AS votes,
  COUNT(*) FILTER (WHERE event_type = 'search') AS searches,
  COUNT(*) FILTER (WHERE event_type = 'game_submission') AS game_submissions,
  ROUND(COUNT(*)::numeric / 7, 2) AS avg_daily_events,
  ROUND(COUNT(DISTINCT user_id)::numeric / 7, 2) AS avg_daily_users,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS avg_events_per_session
FROM tracking_events 
WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- 3. User Behavior Metrics
CREATE VIEW user_behavior_metrics AS
WITH user_stats AS (
  SELECT 
    user_id,
    COUNT(*) AS total_events,
    COUNT(DISTINCT session_id) AS total_sessions,
    COUNT(DISTINCT DATE(created_at)) AS active_days,
    MIN(created_at) AS first_seen,
    MAX(created_at) AS last_seen,
    COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
    COUNT(*) FILTER (WHERE event_type = 'vote') AS votes,
    COUNT(*) FILTER (WHERE event_type = 'search') AS searches,
    COUNT(*) FILTER (WHERE event_type = 'game_submission') AS game_submissions
  FROM tracking_events 
  WHERE user_id IS NOT NULL
  GROUP BY user_id
)
SELECT 
  'user_behavior' AS metric_category,
  'total_active_users' AS metric_name,
  COUNT(*) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_events_per_user' AS metric_name,
  ROUND(AVG(total_events), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_sessions_per_user' AS metric_name,
  ROUND(AVG(total_sessions), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_active_days_per_user' AS metric_name,
  ROUND(AVG(active_days), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_page_views_per_user' AS metric_name,
  ROUND(AVG(page_views), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_votes_per_user' AS metric_name,
  ROUND(AVG(votes), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_searches_per_user' AS metric_name,
  ROUND(AVG(searches), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'avg_game_submissions_per_user' AS metric_name,
  ROUND(AVG(game_submissions), 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'user_retention_7d' AS metric_name,
  ROUND(COUNT(*) FILTER (WHERE last_seen >= CURRENT_DATE - INTERVAL '7 days')::numeric / COUNT(*) * 100, 2) AS value
FROM user_stats
UNION ALL
SELECT 
  'user_behavior' AS metric_category,
  'user_retention_30d' AS metric_name,
  ROUND(COUNT(*) FILTER (WHERE last_seen >= CURRENT_DATE - INTERVAL '30 days')::numeric / COUNT(*) * 100, 2) AS value
FROM user_stats;

-- 4. Performance Metrics
CREATE VIEW performance_metrics AS
WITH session_metrics AS (
  SELECT 
    session_id,
    COUNT(*) AS events_in_session,
    MAX(created_at) - MIN(created_at) AS session_duration,
    COUNT(DISTINCT event_type) AS unique_event_types,
    COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
    COUNT(*) FILTER (WHERE event_type = 'vote') AS votes
  FROM tracking_events 
  GROUP BY session_id
)
SELECT 
  'performance' AS metric_category,
  'avg_session_duration_minutes' AS metric_name,
  ROUND(AVG(EXTRACT(EPOCH FROM session_duration) / 60), 2) AS value
FROM session_metrics
WHERE session_duration IS NOT NULL
UNION ALL
SELECT 
  'performance' AS metric_category,
  'avg_events_per_session' AS metric_name,
  ROUND(AVG(events_in_session), 2) AS value
FROM session_metrics
UNION ALL
SELECT 
  'performance' AS metric_category,
  'avg_unique_event_types_per_session' AS metric_name,
  ROUND(AVG(unique_event_types), 2) AS value
FROM session_metrics
UNION ALL
SELECT 
  'performance' AS metric_category,
  'avg_page_views_per_session' AS metric_name,
  ROUND(AVG(page_views), 2) AS value
FROM session_metrics
UNION ALL
SELECT 
  'performance' AS metric_category,
  'avg_votes_per_session' AS metric_name,
  ROUND(AVG(votes), 2) AS value
FROM session_metrics
UNION ALL
SELECT 
  'performance' AS metric_category,
  'sessions_with_votes_percentage' AS metric_name,
  ROUND(COUNT(*) FILTER (WHERE votes > 0)::numeric / COUNT(*) * 100, 2) AS value
FROM session_metrics
UNION ALL
SELECT 
  'performance' AS metric_category,
  'bounce_rate_percentage' AS metric_name,
  ROUND(COUNT(*) FILTER (WHERE events_in_session = 1)::numeric / COUNT(*) * 100, 2) AS value
FROM session_metrics;

-- 5. Conversion Funnel
CREATE VIEW conversion_funnel AS
WITH funnel_data AS (
  SELECT 
    session_id,
    MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS viewed_page,
    MAX(CASE WHEN event_type = 'search' THEN 1 ELSE 0 END) AS searched,
    MAX(CASE WHEN event_type = 'vote' THEN 1 ELSE 0 END) AS voted,
    MAX(CASE WHEN event_type = 'game_submission' THEN 1 ELSE 0 END) AS submitted_game
  FROM tracking_events 
  GROUP BY session_id
)
SELECT 
  'conversion' AS metric_category,
  'page_views' AS metric_name,
  SUM(viewed_page) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'searches' AS metric_name,
  SUM(searched) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'votes' AS metric_name,
  SUM(voted) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'game_submissions' AS metric_name,
  SUM(submitted_game) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'search_conversion_rate' AS metric_name,
  ROUND(SUM(searched)::numeric / NULLIF(SUM(viewed_page), 0) * 100, 2) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'vote_conversion_rate' AS metric_name,
  ROUND(SUM(voted)::numeric / NULLIF(SUM(viewed_page), 0) * 100, 2) AS value
FROM funnel_data
UNION ALL
SELECT 
  'conversion' AS metric_category,
  'submission_conversion_rate' AS metric_name,
  ROUND(SUM(submitted_game)::numeric / NULLIF(SUM(viewed_page), 0) * 100, 2) AS value
FROM funnel_data;

-- 6. Top Performing Content
CREATE VIEW top_performing_content AS
WITH content_metrics AS (
  SELECT 
    event_data->>'game_name' AS content_name,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM tracking_events 
  WHERE event_data->>'game_name' IS NOT NULL
  GROUP BY event_data->>'game_name', event_type
)
SELECT 
  content_name,
  event_type,
  event_count,
  unique_users,
  unique_sessions,
  ROUND(event_count::numeric / NULLIF(unique_users, 0), 2) AS avg_events_per_user,
  ROUND(unique_users::numeric / NULLIF(unique_sessions, 0), 2) AS user_engagement_rate
FROM content_metrics
ORDER BY event_count DESC
LIMIT 50;

-- 7. Geographic Analytics (based on IP patterns)
CREATE VIEW geographic_analytics AS
SELECT 
  'geographic' AS metric_category,
  'unique_ip_addresses' AS metric_name,
  COUNT(DISTINCT ip_address) AS value
FROM tracking_events 
WHERE ip_address IS NOT NULL
UNION ALL
SELECT 
  'geographic' AS metric_category,
  'events_from_localhost' AS metric_name,
  COUNT(*) AS value
FROM tracking_events 
WHERE ip_address = '::1' OR ip_address = '127.0.0.1'
UNION ALL
SELECT 
  'geographic' AS metric_category,
  'events_from_external_ips' AS metric_name,
  COUNT(*) AS value
FROM tracking_events 
WHERE ip_address IS NOT NULL AND ip_address NOT IN ('::1', '127.0.0.1');

-- 8. Device Analytics
CREATE VIEW device_analytics AS
WITH device_data AS (
  SELECT 
    CASE 
      WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
      WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'Tablet'
      ELSE 'Desktop'
    END AS device_type,
    CASE 
      WHEN user_agent ILIKE '%chrome%' THEN 'Chrome'
      WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
      WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari'
      WHEN user_agent ILIKE '%edge%' THEN 'Edge'
      ELSE 'Other'
    END AS browser_type
  FROM tracking_events 
  WHERE user_agent IS NOT NULL
)
SELECT 
  'device' AS metric_category,
  'desktop_users' AS metric_name,
  COUNT(*) FILTER (WHERE device_type = 'Desktop') AS value
FROM device_data
UNION ALL
SELECT 
  'device' AS metric_category,
  'mobile_users' AS metric_name,
  COUNT(*) FILTER (WHERE device_type = 'Mobile') AS value
FROM device_data
UNION ALL
SELECT 
  'device' AS metric_category,
  'tablet_users' AS metric_name,
  COUNT(*) FILTER (WHERE device_type = 'Tablet') AS value
FROM device_data
UNION ALL
SELECT 
  'device' AS metric_category,
  'chrome_users' AS metric_name,
  COUNT(*) FILTER (WHERE browser_type = 'Chrome') AS value
FROM device_data
UNION ALL
SELECT 
  'device' AS metric_category,
  'firefox_users' AS metric_name,
  COUNT(*) FILTER (WHERE browser_type = 'Firefox') AS value
FROM device_data
UNION ALL
SELECT 
  'device' AS metric_category,
  'safari_users' AS metric_name,
  COUNT(*) FILTER (WHERE browser_type = 'Safari') AS value
FROM device_data;

-- 9. Session Analytics
CREATE VIEW session_analytics AS
WITH session_data AS (
  SELECT 
    session_id,
    user_id,
    MIN(created_at) AS session_start,
    MAX(created_at) AS session_end,
    COUNT(*) AS events_in_session,
    COUNT(DISTINCT event_type) AS unique_event_types,
    COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
    COUNT(*) FILTER (WHERE event_type = 'vote') AS votes,
    COUNT(*) FILTER (WHERE event_type = 'search') AS searches
  FROM tracking_events 
  GROUP BY session_id, user_id
)
SELECT 
  'session' AS metric_category,
  'total_sessions' AS metric_name,
  COUNT(*) AS value
FROM session_data
UNION ALL
SELECT 
  'session' AS metric_category,
  'avg_session_duration_minutes' AS metric_name,
  ROUND(AVG(EXTRACT(EPOCH FROM (session_end - session_start)) / 60), 2) AS value
FROM session_data
WHERE session_end > session_start
UNION ALL
SELECT 
  'session' AS metric_category,
  'avg_events_per_session' AS metric_name,
  ROUND(AVG(events_in_session), 2) AS value
FROM session_data
UNION ALL
SELECT 
  'session' AS metric_category,
  'sessions_with_user' AS metric_name,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS value
FROM session_data
UNION ALL
SELECT 
  'session' AS metric_category,
  'sessions_without_user' AS metric_name,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS value
FROM session_data
UNION ALL
SELECT 
  'session' AS metric_category,
  'sessions_with_votes' AS metric_name,
  COUNT(*) FILTER (WHERE votes > 0) AS value
FROM session_data
UNION ALL
SELECT 
  'session' AS metric_category,
  'sessions_with_searches' AS metric_name,
  COUNT(*) FILTER (WHERE searches > 0) AS value
FROM session_data;
