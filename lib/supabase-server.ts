import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
// ⚠️ NEVER expose this client to the browser!
// Only use in API routes and server components

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseServer: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('Server-side Supabase client not initialized. Missing SUPABASE_SERVICE_ROLE_KEY.');
}

export { supabaseServer };

