-- Halloween Games Dashboard - Additional Analytics Views
-- These views provide specific insights for your game voting site

-- 1. Game Performance Analytics
CREATE OR REPLACE VIEW game_performance_analytics AS
SELECT 
  g.id,
  g.game_name,
  g.steam_app_id,
  g.vote_count,
  g.is_played,
  g.created_at as game_added_date,
  COUNT(v.id) as actual_votes,
  COUNT(DISTINCT v.twitch_user_id) as unique_voters,
  MAX(v.created_at) as last_vote_date,
  ROUND(AVG(EXTRACT(EPOCH FROM (v.created_at - g.created_at)) / 3600), 2) as avg_hours_to_first_vote,
  COUNT(te.id) as total_views,
  COUNT(te.id) FILTER (WHERE te.event_type = 'page_view') as page_views,
  COUNT(te.id) FILTER (WHERE te.event_type = 'vote') as vote_events,
  COUNT(te.id) FILTER (WHERE te.event_type = 'search') as search_mentions
FROM games g
LEFT JOIN votes v ON g.id = v.game_id
LEFT JOIN tracking_events te ON te.event_data->>'game_name' = g.game_name
GROUP BY g.id, g.game_name, g.steam_app_id, g.vote_count, g.is_played, g.created_at
ORDER BY g.vote_count DESC;

-- 2. User Voting Patterns
CREATE OR REPLACE VIEW user_voting_patterns AS
SELECT 
  v.twitch_user_id,
  v.twitch_username,
  COUNT(v.id) as total_votes,
  COUNT(DISTINCT v.game_id) as unique_games_voted,
  MIN(v.created_at) as first_vote_date,
  MAX(v.created_at) as last_vote_date,
  ROUND(EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at)) / 3600), 2) as voting_session_hours,
  COUNT(te.id) as total_events,
  COUNT(te.id) FILTER (WHERE te.event_type = 'page_view') as page_views,
  COUNT(te.id) FILTER (WHERE te.event_type = 'search') as searches,
  COUNT(te.id) FILTER (WHERE te.event_type = 'game_submission') as game_submissions
FROM votes v
LEFT JOIN tracking_events te ON te.user_id = v.twitch_user_id
GROUP BY v.twitch_user_id, v.twitch_username
ORDER BY total_votes DESC;

-- 3. Real-time Activity Feed
CREATE OR REPLACE VIEW real_time_activity AS
SELECT 
  te.id,
  te.event_type,
  te.event_data,
  te.page_url,
  te.created_at,
  te.user_id,
  te.session_id,
  CASE 
    WHEN te.event_type = 'vote' THEN te.event_data->>'game_name'
    WHEN te.event_type = 'search' THEN te.event_data->>'query'
    WHEN te.event_type = 'game_submission' THEN te.event_data->>'game_name'
    ELSE NULL
  END as content_name,
  CASE 
    WHEN te.user_id IS NOT NULL THEN 'Authenticated User'
    ELSE 'Anonymous User'
  END as user_type
FROM tracking_events te
WHERE te.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY te.created_at DESC;

-- 4. Game Discovery Analytics
CREATE OR REPLACE VIEW game_discovery_analytics AS
SELECT 
  g.game_name,
  g.vote_count,
  COUNT(te.id) FILTER (WHERE te.event_type = 'search' AND te.event_data->>'query' ILIKE '%' || g.game_name || '%') as search_mentions,
  COUNT(te.id) FILTER (WHERE te.event_type = 'page_view' AND te.page_url ILIKE '%game%') as page_views,
  COUNT(te.id) FILTER (WHERE te.event_type = 'vote' AND te.event_data->>'game_name' = g.game_name) as vote_events,
  ROUND(
    COUNT(te.id) FILTER (WHERE te.event_type = 'vote' AND te.event_data->>'game_name' = g.game_name)::numeric / 
    NULLIF(COUNT(te.id) FILTER (WHERE te.event_type = 'page_view' AND te.page_url ILIKE '%game%'), 0) * 100, 
    2
  ) as conversion_rate_percent
FROM games g
LEFT JOIN tracking_events te ON te.created_at >= g.created_at
GROUP BY g.game_name, g.vote_count
ORDER BY g.vote_count DESC;

-- 5. Session Journey Analytics
CREATE OR REPLACE VIEW session_journey_analytics AS
WITH session_events AS (
  SELECT 
    te.session_id,
    te.user_id,
    te.event_type,
    te.event_data,
    te.created_at,
    ROW_NUMBER() OVER (PARTITION BY te.session_id ORDER BY te.created_at) as event_sequence
  FROM tracking_events te
  WHERE te.created_at >= NOW() - INTERVAL '7 days'
),
session_summaries AS (
  SELECT 
    session_id,
    user_id,
    COUNT(*) as total_events,
    MIN(created_at) as session_start,
    MAX(created_at) as session_end,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
    COUNT(*) FILTER (WHERE event_type = 'vote') as votes,
    COUNT(*) FILTER (WHERE event_type = 'search') as searches,
    COUNT(*) FILTER (WHERE event_type = 'game_submission') as submissions,
    ARRAY_AGG(event_type ORDER BY created_at) as event_sequence
  FROM session_events
  GROUP BY session_id, user_id
)
SELECT 
  session_id,
  CASE WHEN user_id IS NOT NULL THEN 'Authenticated' ELSE 'Anonymous' END as user_type,
  total_events,
  ROUND(EXTRACT(EPOCH FROM (session_end - session_start)) / 60, 2) as session_duration_minutes,
  page_views,
  votes,
  searches,
  submissions,
  CASE 
    WHEN votes > 0 AND searches > 0 THEN 'Engaged Voter'
    WHEN votes > 0 THEN 'Voter Only'
    WHEN searches > 0 THEN 'Browser Only'
    ELSE 'Passive Viewer'
  END as user_behavior_type,
  event_sequence
FROM session_summaries
ORDER BY session_start DESC;

-- 6. Halloween Games Leaderboard
CREATE OR REPLACE VIEW halloween_games_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY g.vote_count DESC, g.created_at ASC) as rank,
  g.game_name,
  g.steam_app_id,
  g.vote_count,
  g.is_played,
  COUNT(v.id) as actual_votes,
  COUNT(DISTINCT v.twitch_user_id) as unique_voters,
  ROUND(COUNT(v.id)::numeric / NULLIF(COUNT(te.id) FILTER (WHERE te.event_type = 'page_view'), 0) * 100, 2) as vote_conversion_rate,
  MAX(v.created_at) as last_vote_date,
  CASE 
    WHEN g.is_played THEN '✅ Played'
    WHEN g.vote_count >= 3 THEN '🔥 Popular'
    WHEN g.vote_count >= 1 THEN '👍 Voted'
    ELSE '⏳ Waiting'
  END as status
FROM games g
LEFT JOIN votes v ON g.id = v.game_id
LEFT JOIN tracking_events te ON te.event_data->>'game_name' = g.game_name
GROUP BY g.id, g.game_name, g.steam_app_id, g.vote_count, g.is_played, g.created_at
ORDER BY g.vote_count DESC, g.created_at ASC;

-- 7. Time-based Activity Patterns
CREATE OR REPLACE VIEW time_activity_patterns AS
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  EXTRACT(DOW FROM created_at) as day_of_week,
  TO_CHAR(created_at, 'Day') as day_name,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE event_type = 'vote') as votes,
  COUNT(*) FILTER (WHERE event_type = 'search') as searches,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  ROUND(AVG(COUNT(*)) OVER (PARTITION BY EXTRACT(HOUR FROM created_at)), 2) as avg_events_per_hour
FROM tracking_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
ORDER BY day_of_week, hour_of_day;

-- Grant permissions
GRANT SELECT ON game_performance_analytics TO authenticated;
GRANT SELECT ON user_voting_patterns TO authenticated;
GRANT SELECT ON real_time_activity TO authenticated;
GRANT SELECT ON game_discovery_analytics TO authenticated;
GRANT SELECT ON session_journey_analytics TO authenticated;
GRANT SELECT ON halloween_games_leaderboard TO authenticated;
GRANT SELECT ON time_activity_patterns TO authenticated;
