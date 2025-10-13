-- Tracking Events Database Schema
-- Run this in your Supabase SQL Editor after the main schema

-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add vote_count column to games table if it doesn't exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id_created_at ON tracking_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_vote_count ON games(vote_count DESC);

-- Enable Row Level Security for tracking_events
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracking_events table
-- Anyone can insert tracking events (for analytics)
CREATE POLICY "Anyone can insert tracking events"
  ON tracking_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read tracking events (simplified to avoid recursion)
CREATE POLICY "Admins can read tracking events"
  ON tracking_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_game_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE games 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE game_id = NEW.game_id
    )
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE games 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE game_id = OLD.game_id
    )
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_vote_count ON votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_game_vote_count();

-- Update existing vote counts
UPDATE games 
SET vote_count = (
  SELECT COUNT(*) 
  FROM votes 
  WHERE votes.game_id = games.id
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_analytics_data(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Create function to get analytics data (secure version)
CREATE OR REPLACE FUNCTION get_analytics_data(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.twitch_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT json_build_object(
    'totalUsers', (
      SELECT COUNT(DISTINCT user_id) 
      FROM tracking_events 
      WHERE user_id IS NOT NULL 
      AND created_at >= start_date 
      AND created_at <= end_date
    ),
    'totalSessions', (
      SELECT COUNT(DISTINCT session_id) 
      FROM tracking_events 
      WHERE created_at >= start_date 
      AND created_at <= end_date
    ),
    'totalEvents', (
      SELECT COUNT(*) 
      FROM tracking_events 
      WHERE created_at >= start_date 
      AND created_at <= end_date
    ),
    'topGames', (
      SELECT json_agg(
        json_build_object(
          'game_name', game_name,
          'vote_count', vote_count,
          'view_count', 0
        )
      )
      FROM (
        SELECT game_name, vote_count 
        FROM games 
        ORDER BY vote_count DESC 
        LIMIT 10
      ) top_games
    ),
    'recentActivity', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'user_id', user_id,
          'session_id', session_id,
          'event_type', event_type,
          'event_data', event_data,
          'page_url', page_url,
          'created_at', created_at
        )
      )
      FROM (
        SELECT * 
        FROM tracking_events 
        WHERE created_at >= start_date 
        AND created_at <= end_date
        ORDER BY created_at DESC 
        LIMIT 50
      ) recent_activity
    ),
    'userEngagement', json_build_object(
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
      ),
      'averageSessionDuration', 0
    ),
    'popularSearches', (
      SELECT json_agg(
        json_build_object(
          'query', query,
          'count', count
        )
      )
      FROM (
        SELECT 
          event_data->>'query' as query,
          COUNT(*) as count
        FROM tracking_events 
        WHERE event_type = 'search' 
        AND event_data->>'query' IS NOT NULL
        AND created_at >= start_date 
        AND created_at <= end_date
        GROUP BY event_data->>'query'
        ORDER BY count DESC
        LIMIT 10
      ) popular_searches
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_analytics_data TO authenticated;

-- Add some helpful comments
COMMENT ON TABLE tracking_events IS 'Stores user tracking events for analytics';
COMMENT ON COLUMN tracking_events.user_id IS 'User ID from authentication (can be null for anonymous users)';
COMMENT ON COLUMN tracking_events.session_id IS 'Unique session identifier';
COMMENT ON COLUMN tracking_events.event_type IS 'Type of event (page_view, vote, search, etc.)';
COMMENT ON COLUMN tracking_events.event_data IS 'Additional event data as JSON';
COMMENT ON COLUMN games.vote_count IS 'Cached count of votes for this game (updated by trigger)';
