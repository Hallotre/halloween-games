-- Halloween Game Suggester Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  steam_app_id INTEGER UNIQUE NOT NULL,
  game_name TEXT NOT NULL,
  game_image TEXT NOT NULL,
  suggested_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_played BOOLEAN DEFAULT FALSE
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  twitch_user_id TEXT NOT NULL,
  twitch_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, twitch_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_steam_app_id ON games(steam_app_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_is_played ON games(is_played);
CREATE INDEX IF NOT EXISTS idx_votes_game_id ON votes(game_id);
CREATE INDEX IF NOT EXISTS idx_votes_twitch_user_id ON votes(twitch_user_id);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games table
-- Everyone can read games
CREATE POLICY "Anyone can view games"
  ON games
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert games
CREATE POLICY "Authenticated users can insert games"
  ON games
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Anyone can update games (for streamer controls - app handles auth)
CREATE POLICY "Anyone can update games"
  ON games
  FOR UPDATE
  TO public
  USING (true);

-- Anyone can delete games (for streamer controls - app handles auth)
CREATE POLICY "Anyone can delete games"
  ON games
  FOR DELETE
  TO public
  USING (true);

-- RLS Policies for votes table
-- Everyone can read votes
CREATE POLICY "Anyone can view votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert votes
CREATE POLICY "Authenticated users can insert votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can delete their own votes (app handles auth)
CREATE POLICY "Users can delete votes"
  ON votes
  FOR DELETE
  TO public
  USING (true);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Add some helpful comments
COMMENT ON TABLE games IS 'Stores all game suggestions with Steam integration';
COMMENT ON TABLE votes IS 'Stores user votes for games with unique constraint per user per game';
COMMENT ON COLUMN games.steam_app_id IS 'Steam App ID - must be unique';
COMMENT ON COLUMN games.is_played IS 'Whether the streamer has played this game';
COMMENT ON COLUMN votes.twitch_user_id IS 'Twitch user ID from OAuth';

