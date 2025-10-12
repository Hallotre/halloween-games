-- Admin/Streamer Management Schema
-- Run this in your Supabase SQL Editor

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitch_user_id TEXT UNIQUE NOT NULL,
  twitch_username TEXT NOT NULL,
  added_by TEXT, -- Twitch user ID of who added this admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_twitch_user_id ON admins(twitch_user_id);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
-- Everyone can read admins (to check if someone is an admin)
CREATE POLICY "Anyone can view admins"
  ON admins
  FOR SELECT
  TO public
  USING (true);

-- No direct inserts/updates/deletes - must go through API
CREATE POLICY "No direct inserts to admins"
  ON admins
  FOR INSERT
  TO public
  WITH CHECK (false);

CREATE POLICY "No direct updates to admins"
  ON admins
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "No direct deletes to admins"
  ON admins
  FOR DELETE
  TO public
  USING (false);

-- Enable real-time for admins table
ALTER PUBLICATION supabase_realtime ADD TABLE admins;

-- Add helpful comments
COMMENT ON TABLE admins IS 'Stores admin/streamer users who can manage games and other admins';
COMMENT ON COLUMN admins.twitch_user_id IS 'Twitch user ID from OAuth - must be unique';
COMMENT ON COLUMN admins.added_by IS 'Twitch user ID of the admin who added this user';

-- Insert your initial admin (replace with your Twitch user ID)
-- Get your Twitch user ID by logging in and checking the session
INSERT INTO admins (twitch_user_id, twitch_username, added_by)
VALUES ('TwitchUserid', 'YourTwitchUsername', 'TwitchUserid')
ON CONFLICT (twitch_user_id) DO NOTHING;

-- Note: After running this, you should update the admin username
-- by logging in and checking your actual username from the session

