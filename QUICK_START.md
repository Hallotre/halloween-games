# Quick Start Guide ⚡

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Twitch account
- 10 minutes of your time

## Step 1: Clone and Install (1 minute)

```bash
git clone <your-repo-url>
cd halloween-games
npm install
```

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project (wait ~2 minutes)
3. Go to SQL Editor → New Query
4. Copy/paste contents of `supabase-schema.sql` → Run
5. Go to Settings → API → Copy:
   - Project URL
   - anon public key

## Step 3: Set Up Twitch (2 minutes)

1. Go to [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Register Your Application:
   - Name: Halloween Games
   - OAuth Redirect: `http://localhost:3000/api/auth/callback/twitch`
   - Category: Website Integration
3. Copy Client ID and generate Client Secret

## Step 4: Get Your Twitch User ID (30 seconds)

1. Go to [streamweasels.com/tools/convert-twitch-username-to-user-id](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
2. Enter your Twitch username
3. Copy the User ID

## Step 5: Configure Environment (1 minute)

Create `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-random-string-here
TWITCH_CLIENT_ID=paste-from-step-3
TWITCH_CLIENT_SECRET=paste-from-step-3
NEXT_PUBLIC_SUPABASE_URL=paste-from-step-2
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-from-step-2
STEAM_API_KEY=
STREAMER_TWITCH_ID=paste-from-step-4
```

**Generate NEXTAUTH_SECRET:**
- Windows: Use any 32+ character random string
- Mac/Linux: `openssl rand -base64 32`

## Step 6: Run! (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎉 Done!

You should now see the app running. Try:
1. Click "Sign in with Twitch"
2. Click "Suggest a Spooky Game"
3. Search for a game (e.g., "Resident Evil")
4. Submit and vote!

## 🚨 Troubleshooting

**"Failed to fetch games"**
- Check Supabase URL and key in `.env.local`
- Verify SQL schema was run successfully

**"Sign in not working"**
- Check Twitch callback URL matches exactly
- Verify Client ID and Secret are correct

**"Streamer controls not showing"**
- Check STREAMER_TWITCH_ID matches your user ID
- Sign out and sign back in

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `SETUP_GUIDE.md` for detailed setup
- Review `DEPLOYMENT_CHECKLIST.md` for going live

## 🎃 Ready to Deploy?

See `DEPLOYMENT_CHECKLIST.md` for Vercel deployment instructions!

---

**Need help?** Open an issue on GitHub or check the other documentation files.

