import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have valid environment variables
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables not found. Supabase client will not be initialized.');
  
  // Create a mock client for development
  if (typeof window !== 'undefined') {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
  }
}

export { supabase };

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

