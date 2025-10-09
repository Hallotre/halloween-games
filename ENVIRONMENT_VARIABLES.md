# Environment Variables for Norwegian Halloween Game Suggester

## Required Environment Variables

Update your `.env.local` file with these variables:

```env
# NextAuth Configuration (Updated for NextAuth v5)
AUTH_SECRET=your-random-secret-here
AUTH_URL=http://localhost:3000

# Twitch OAuth (Updated variable names)
AUTH_TWITCH_ID=your-twitch-client-id
AUTH_TWITCH_SECRET=your-twitch-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Steam API (Optional)
STEAM_API_KEY=your-steam-api-key

# Streamer Configuration
STREAMER_TWITCH_ID=your-twitch-user-id
```

## Changes Made for NextAuth v5

### Old Variable Names → New Variable Names
- `NEXTAUTH_SECRET` → `AUTH_SECRET`
- `NEXTAUTH_URL` → `AUTH_URL`
- `TWITCH_CLIENT_ID` → `AUTH_TWITCH_ID`
- `TWITCH_CLIENT_SECRET` → `AUTH_TWITCH_SECRET`

## Twitch OAuth Callback URLs

Make sure to update your Twitch application with the correct callback URL:

**Development:**
```
http://localhost:3000/api/auth/callback/twitch
```

**Production:**
```
https://your-domain.vercel.app/api/auth/callback/twitch
```

## Generating AUTH_SECRET

```bash
openssl rand -base64 32
```

## Finding Your Twitch User ID

1. Go to https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
2. Enter your Twitch username
3. Copy the User ID
