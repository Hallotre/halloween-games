# 🚀 Deployment Guide - Halloween Game Suggester

## ✅ **READY FOR GITHUB DEPLOYMENT**

The codebase is now ready for deployment to Vercel! All hardcoded credentials have been removed and proper environment variable usage has been restored.

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Variables Setup**

Create a `.env.local` file with these variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Twitch OAuth (Get from https://dev.twitch.tv/console)
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Supabase (Get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Steam API (Optional - most endpoints work without it)
STEAM_API_KEY=your-steam-api-key

# Streamer Configuration (Your Twitch user ID)
STREAMER_TWITCH_ID=your-twitch-user-id
```

### 2. **Generate Required Secrets**

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Find your Twitch User ID
# Go to: https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
```

### 3. **Database Setup**

1. Run the SQL schema in your Supabase project:
   - Copy contents of `supabase-schema.sql`
   - Paste into Supabase SQL Editor
   - Execute the script

2. Verify real-time is enabled:
   - Go to Database → Replication
   - Ensure `games` and `votes` tables are enabled

## 🚀 **Deployment Steps**

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment - removed hardcoded credentials"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel:
   - Copy all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
5. Deploy!

### Step 3: Update Twitch OAuth Settings

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Edit your application
3. Add production callback URL:
   - `https://your-domain.vercel.app/api/auth/callback/twitch`

## 🔧 **Production Environment Variables**

In Vercel, set these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your production URL | `https://halloween-games.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | `abc123...` |
| `TWITCH_CLIENT_ID` | From Twitch Developer Console | `d05jo383...` |
| `TWITCH_CLIENT_SECRET` | From Twitch Developer Console | `1b35euk...` |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Dashboard | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Dashboard | `eyJhbGc...` |
| `STEAM_API_KEY` | Optional Steam API key | `ABC123...` |
| `STREAMER_TWITCH_ID` | Your Twitch User ID | `97147070` |

## ✅ **Verification Steps**

After deployment, verify:

1. **App loads** without errors
2. **Twitch login** works (redirects to Twitch and back)
3. **Game search** works (try searching for "Resident Evil")
4. **Game submission** works (submit a game)
5. **Voting** works (vote on games)
6. **Real-time updates** work (open in two windows, vote in one)
7. **Streamer controls** work (if you're the streamer)

## 🐛 **Troubleshooting**

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel

2. **Twitch OAuth not working**
   - Verify callback URL matches exactly in Twitch console
   - Check `NEXTAUTH_URL` is set to production URL

3. **Database connection issues**
   - Verify Supabase credentials are correct
   - Check that database schema was run successfully

4. **Real-time not working**
   - Ensure tables are enabled in Supabase Replication settings
   - Check browser console for WebSocket errors

## 🎯 **Next Steps After Deployment**

1. **Test all features** thoroughly
2. **Share the URL** with your community
3. **Monitor usage** in Vercel and Supabase dashboards
4. **Consider adding** more features like:
   - Game categories
   - User profiles
   - Game history
   - Analytics

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Check Vercel function logs
3. Check Supabase logs
4. Review this deployment guide

---

**🎃 Happy Halloween Streaming! 👻**
