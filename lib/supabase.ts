import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Game = {
  id: string;
  steam_app_id: number;
  game_name: string;
  game_image: string;
  suggested_by: string;
  created_at: string;
  is_played: boolean;
  vote_count?: number;
};

export type Vote = {
  id: string;
  game_id: string;
  twitch_user_id: string;
  twitch_username: string;
  created_at: string;
};

