-- Create the comprehensive analytics function after the views are created
-- Run this after running fix-event-summary-simple.sql

-- Create a comprehensive analytics function that works with the views
CREATE OR REPLACE FUNCTION get_comprehensive_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.jwt() ->> 'sub'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get comprehensive analytics
  SELECT jsonb_build_object(
    'basic_metrics', (
      SELECT jsonb_build_object(
        'totalUsers', (
          SELECT COUNT(DISTINCT user_id) 
          FROM tracking_events 
          WHERE user_id IS NOT NULL 
            AND created_at BETWEEN start_date AND end_date
        ),
        'totalSessions', (
          SELECT COUNT(DISTINCT session_id) 
          FROM tracking_events 
          WHERE created_at BETWEEN start_date AND end_date
        ),
        'totalEvents', (
          SELECT COUNT(*) 
          FROM tracking_events 
          WHERE created_at BETWEEN start_date AND end_date
        ),
        'dailyActiveUsers', (
          SELECT COUNT(DISTINCT user_id) 
          FROM tracking_events 
          WHERE user_id IS NOT NULL 
            AND created_at >= NOW() - INTERVAL '1 day'
        ),
        'weeklyActiveUsers', (
          SELECT COUNT(DISTINCT user_id) 
          FROM tracking_events 
          WHERE user_id IS NOT NULL 
            AND created_at >= NOW() - INTERVAL '7 days'
        )
      )
    ),
    'event_summary', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type', event_type,
          'count', count,
          'unique_users', unique_users,
          'sessions', sessions,
          'unique_sessions', unique_sessions,
          'avg_events_per_user', avg_events_per_user,
          'last_24h_count', last_24h_count,
          'last_7d_count', last_7d_count,
          'suspicious_events', suspicious_events
        )
      )
      FROM event_summary
    ),
    'daily_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date,
          'total_events', total_events,
          'daily_active_users', daily_active_users,
          'daily_sessions', daily_sessions,
          'page_views', page_views,
          'votes', votes,
          'searches', searches,
          'game_submissions', game_submissions
        )
      )
      FROM daily_activity_summary
      ORDER BY date DESC
      LIMIT 30
    ),
    'security_metrics', (
      SELECT jsonb_object_agg(metric, value)
      FROM security_analytics
    ),
    'engagement_metrics', (
      SELECT jsonb_object_agg(metric, value)
      FROM user_engagement_metrics
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_comprehensive_analytics() TO authenticated;
