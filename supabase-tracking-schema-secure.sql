-- SECURE Tracking and Analytics Schema
-- Run this in your Supabase SQL editor to replace the previous schema

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow anonymous tracking" ON tracking_events;
DROP POLICY IF EXISTS "Admins can read all tracking data" ON tracking_events;
DROP POLICY IF EXISTS "Users can read own tracking data" ON tracking_events;

-- Create tracking_events table (if not exists)
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_session ON tracking_events(user_id, session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- SECURE POLICIES

-- 1. Only allow INSERT for tracking events with strict validation
CREATE POLICY "Secure tracking insert" ON tracking_events
  FOR INSERT WITH CHECK (
    -- Must have a valid session_id
    session_id IS NOT NULL 
    AND LENGTH(session_id) > 10
    AND LENGTH(session_id) < 100
    -- Must have a valid event_type
    AND event_type IS NOT NULL
    AND LENGTH(event_type) > 0
    AND LENGTH(event_type) < 50
    -- Event data must be valid JSON and not too large
    AND event_data IS NOT NULL
    AND jsonb_typeof(event_data) = 'object'
    AND LENGTH(event_data::text) < 10000
    -- Page URL validation
    AND (page_url IS NULL OR (LENGTH(page_url) > 0 AND LENGTH(page_url) < 2000))
    -- User agent validation
    AND (user_agent IS NULL OR (LENGTH(user_agent) > 0 AND LENGTH(user_agent) < 1000))
    -- Rate limiting: max 100 events per session per hour
    AND (
      SELECT COUNT(*) 
      FROM tracking_events 
      WHERE session_id = tracking_events.session_id 
        AND created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );

-- 2. Only admins can read tracking data
CREATE POLICY "Only admins can read tracking data" ON tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.twitch_user_id = auth.jwt() ->> 'sub'
        AND admins.twitch_user_id IS NOT NULL
    )
  );

-- 3. No updates allowed (tracking data should be immutable)
CREATE POLICY "No updates allowed" ON tracking_events
  FOR UPDATE USING (false);

-- 4. Only admins can delete tracking data (for cleanup)
CREATE POLICY "Only admins can delete tracking data" ON tracking_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.twitch_user_id = auth.jwt() ->> 'sub'
        AND admins.twitch_user_id IS NOT NULL
    )
  );

-- Create analytics views with proper security
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users
FROM tracking_events 
WHERE user_id IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days' -- Only last 30 days
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Secure the view
ALTER VIEW daily_active_users SET (security_invoker = true);

CREATE OR REPLACE VIEW event_summary AS
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM tracking_events 
WHERE created_at >= NOW() - INTERVAL '30 days' -- Only last 30 days
GROUP BY event_type
ORDER BY count DESC;

-- Secure the view
ALTER VIEW event_summary SET (security_invoker = true);

CREATE OR REPLACE VIEW popular_searches AS
SELECT 
  event_data->>'query' as search_query,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users
FROM tracking_events 
WHERE event_type = 'search' 
  AND event_data->>'query' IS NOT NULL
  AND event_data->>'query' != ''
  AND LENGTH(event_data->>'query') > 2 -- Ignore very short queries
  AND LENGTH(event_data->>'query') < 100 -- Ignore very long queries
  AND created_at >= NOW() - INTERVAL '7 days' -- Only last 7 days
GROUP BY event_data->>'query'
ORDER BY search_count DESC
LIMIT 20;

-- Secure the view
ALTER VIEW popular_searches SET (security_invoker = true);

-- Create a secure function to get analytics data
CREATE OR REPLACE FUNCTION get_analytics_data(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Validate date range
  IF start_date > end_date THEN
    RAISE EXCEPTION 'Invalid date range: start_date must be before end_date';
  END IF;

  IF end_date - start_date > INTERVAL '1 year' THEN
    RAISE EXCEPTION 'Date range too large: Maximum 1 year allowed';
  END IF;

  -- Get analytics data
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
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION get_analytics_data TO authenticated;

-- Create a secure cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_tracking_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.jwt() ->> 'sub'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Delete tracking events older than 90 days
  DELETE FROM tracking_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up tracking data older than 90 days';
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION cleanup_old_tracking_data TO authenticated;

-- Create a function to get user's own tracking data (limited)
CREATE OR REPLACE FUNCTION get_user_tracking_data(
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.jwt() ->> 'sub' IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Limit the number of results
  IF limit_count > 1000 THEN
    limit_count := 1000;
  END IF;

  RETURN QUERY
  SELECT 
    te.event_type,
    te.event_data,
    te.created_at
  FROM tracking_events te
  WHERE te.user_id = auth.jwt() ->> 'sub'
  ORDER BY te.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_tracking_data TO authenticated;

-- Create indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at_user ON tracking_events(created_at, user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type_created ON tracking_events(event_type, created_at);

-- Add constraints for data integrity
ALTER TABLE tracking_events 
ADD CONSTRAINT check_session_id_format 
CHECK (session_id ~ '^[a-zA-Z0-9_-]+$');

ALTER TABLE tracking_events 
ADD CONSTRAINT check_event_type_format 
CHECK (event_type ~ '^[a-zA-Z0-9_]+$');

ALTER TABLE tracking_events 
ADD CONSTRAINT check_event_data_size 
CHECK (LENGTH(event_data::text) < 10000);

-- Create a function to validate and sanitize tracking data
CREATE OR REPLACE FUNCTION sanitize_tracking_data(
  input_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  sanitized JSONB;
  key TEXT;
  value JSONB;
BEGIN
  sanitized := '{}';
  
  -- Only allow specific keys and sanitize values
  FOR key, value IN SELECT * FROM jsonb_each(input_data)
  LOOP
    -- Only allow alphanumeric keys with underscores
    IF key ~ '^[a-zA-Z0-9_]+$' AND LENGTH(key) < 50 THEN
      -- Sanitize string values
      IF jsonb_typeof(value) = 'string' THEN
        -- Remove potentially dangerous characters and limit length
        sanitized := sanitized || jsonb_build_object(
          key, 
          regexp_replace(
            substring(value #>> '{}', 1, 500), 
            '[<>"\''&]', '', 'g'
          )
        );
      ELSIF jsonb_typeof(value) IN ('number', 'boolean') THEN
        -- Allow numbers and booleans as-is
        sanitized := sanitized || jsonb_build_object(key, value);
      END IF;
    END IF;
  END LOOP;
  
  RETURN sanitized;
END;
$$;

-- Update the insert policy to use sanitization
DROP POLICY IF EXISTS "Secure tracking insert" ON tracking_events;

CREATE POLICY "Secure tracking insert with sanitization" ON tracking_events
  FOR INSERT WITH CHECK (
    -- Must have a valid session_id
    session_id IS NOT NULL 
    AND LENGTH(session_id) > 10
    AND LENGTH(session_id) < 100
    -- Must have a valid event_type
    AND event_type IS NOT NULL
    AND LENGTH(event_type) > 0
    AND LENGTH(event_type) < 50
    -- Event data must be valid JSON and not too large
    AND event_data IS NOT NULL
    AND jsonb_typeof(event_data) = 'object'
    AND LENGTH(event_data::text) < 10000
    -- Page URL validation
    AND (page_url IS NULL OR (LENGTH(page_url) > 0 AND LENGTH(page_url) < 2000))
    -- User agent validation
    AND (user_agent IS NULL OR (LENGTH(user_agent) > 0 AND LENGTH(user_agent) < 1000))
    -- Rate limiting: max 100 events per session per hour
    AND (
      SELECT COUNT(*) 
      FROM tracking_events 
      WHERE session_id = tracking_events.session_id 
        AND created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );

-- Create a trigger to sanitize data before insert
CREATE OR REPLACE FUNCTION sanitize_tracking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sanitize event_data
  NEW.event_data := sanitize_tracking_data(NEW.event_data);
  
  -- Sanitize page_url
  IF NEW.page_url IS NOT NULL THEN
    NEW.page_url := regexp_replace(NEW.page_url, '[<>"\''&]', '', 'g');
  END IF;
  
  -- Sanitize user_agent
  IF NEW.user_agent IS NOT NULL THEN
    NEW.user_agent := regexp_replace(NEW.user_agent, '[<>"\''&]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_tracking_event_trigger
  BEFORE INSERT ON tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_tracking_event();

-- Create a function to monitor suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
  session_id TEXT,
  event_count BIGINT,
  suspicious_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = auth.jwt() ->> 'sub'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    te.session_id,
    COUNT(*) as event_count,
    CASE 
      WHEN COUNT(*) > 50 THEN 'High event count in 1 hour'
      WHEN COUNT(DISTINCT te.event_type) > 10 THEN 'Too many different event types'
      ELSE 'Normal activity'
    END as suspicious_reason
  FROM tracking_events te
  WHERE te.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY te.session_id
  HAVING COUNT(*) > 20 -- Flag sessions with more than 20 events in 1 hour
  ORDER BY event_count DESC;
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO authenticated;
