-- Create secure views for user_engagement_metrics and security_analytics
-- Using security_invoker = on for proper security

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_engagement_metrics;
DROP VIEW IF EXISTS security_analytics;

-- Create secure user_engagement_metrics view with security_invoker
CREATE VIEW public.user_engagement_metrics WITH (security_invoker = on) AS
SELECT 
  'avg_events_per_user' as metric,
  ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as value
FROM tracking_events
WHERE user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
UNION ALL
SELECT 
  'avg_events_per_session' as metric,
  ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT session_id), 0), 2) as value
FROM tracking_events
WHERE EXISTS (
  SELECT 1 FROM admins 
  WHERE admins.twitch_user_id = auth.uid()::text
)
UNION ALL
SELECT 
  'user_retention_rate' as metric,
  ROUND(
    COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::DECIMAL / 
    NULLIF(COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) * 100, 
    2
  ) as value
FROM tracking_events
WHERE user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
UNION ALL
SELECT 
  'total_active_users_7d' as metric,
  COUNT(DISTINCT user_id) as value
FROM tracking_events
WHERE user_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
UNION ALL
SELECT 
  'total_active_users_30d' as metric,
  COUNT(DISTINCT user_id) as value
FROM tracking_events
WHERE user_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  );

-- Create secure security_analytics view with security_invoker
CREATE VIEW public.security_analytics WITH (security_invoker = on) AS
SELECT 
  'suspicious_sessions' as metric,
  COUNT(*) as value
FROM (
  SELECT 
    session_id,
    COUNT(*) as event_count
  FROM tracking_events
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.twitch_user_id = auth.uid()::text
    )
  GROUP BY session_id
  HAVING COUNT(*) > 20
) suspicious_sessions
UNION ALL
SELECT 
  'high_risk_events' as metric,
  COUNT(*) as value
FROM tracking_events
WHERE session_id IN (
  SELECT session_id 
  FROM (
    SELECT 
      session_id,
      COUNT(*) as event_count
    FROM tracking_events
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.twitch_user_id = auth.uid()::text
      )
    GROUP BY session_id
    HAVING COUNT(*) > 20
  ) suspicious_sessions
)
AND EXISTS (
  SELECT 1 FROM admins 
  WHERE admins.twitch_user_id = auth.uid()::text
)
UNION ALL
SELECT 
  'total_sanitized_events' as metric,
  COUNT(*) as value
FROM tracking_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
UNION ALL
SELECT 
  'events_per_hour_avg' as metric,
  ROUND(COUNT(*)::DECIMAL / 24, 2) as value
FROM tracking_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  )
UNION ALL
SELECT 
  'unique_sessions_24h' as metric,
  COUNT(DISTINCT session_id) as value
FROM tracking_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.uid()::text
  );

-- Grant permissions
GRANT SELECT ON user_engagement_metrics TO authenticated;
GRANT SELECT ON security_analytics TO authenticated;

-- Verify the views are created
SELECT 
  schemaname, 
  viewname, 
  viewowner
FROM pg_views 
WHERE viewname IN ('user_engagement_metrics', 'security_analytics');
