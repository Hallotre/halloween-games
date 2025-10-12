# Environment Variables for Norwegian Halloween Game Suggester

## Required Environment Variables

Update your `.env.local` file with these variables:

```env
# NextAuth Configuration (NextAuth v4)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Twitch OAuth
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Server (CRITICAL FOR SECURITY)
# ⚠️ NEVER expose this key to the browser! Only use in API routes
# Get this from Supabase Dashboard > Project Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Steam API (Optional)
STEAM_API_KEY=your-steam-api-key

# Streamer Configuration
STREAMER_TWITCH_ID=your-twitch-user-id

# Analytics (Optional)
# Get your Clarity ID from https://clarity.microsoft.com/
NEXT_PUBLIC_CLARITY_ID=your-clarity-project-id

# Google Analytics (Optional)
# If not set, defaults to G-7BMRKE9L79
NEXT_PUBLIC_GA_ID=G-7BMRKE9L79
```

## Important Notes

### NextAuth Version
This project uses **NextAuth v4** (not v5). The variable names above are correct for v4.

### Fallback Support
The authentication configuration supports both old and new variable name formats for compatibility:
- `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `TWITCH_CLIENT_ID` or `AUTH_TWITCH_ID`
- `TWITCH_CLIENT_SECRET` or `AUTH_TWITCH_SECRET`

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


