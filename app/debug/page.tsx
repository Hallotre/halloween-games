'use client';

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        <p><strong>AUTH_URL:</strong> {process.env.AUTH_URL || 'NOT SET'}</p>
        <p><strong>AUTH_SECRET:</strong> {process.env.AUTH_SECRET ? 'SET' : 'NOT SET'}</p>
        <p><strong>AUTH_TWITCH_ID:</strong> {process.env.AUTH_TWITCH_ID || 'NOT SET'}</p>
        <p><strong>AUTH_TWITCH_SECRET:</strong> {process.env.AUTH_TWITCH_SECRET ? 'SET' : 'NOT SET'}</p>
      </div>
    </div>
  );
}
