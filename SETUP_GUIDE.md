# Quick Setup Guide 🚀

This guide will help you get the Halloween Game Suggester up and running in under 10 minutes!

## Step 1: Supabase Setup (3 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in:
   - **Name**: halloween-games (or any name)
   - **Database Password**: (generate a strong password - save this!)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)
5. Once ready, go to **SQL Editor** (left sidebar)
6. Click "New Query"
7. Copy and paste the entire contents of `supabase-schema.sql`
8. Click "Run" or press Ctrl+Enter
9. You should see "Success. No rows returned"
10. **Verify Realtime is Enabled** (Important!):
    - The SQL schema automatically enables realtime via the `ALTER PUBLICATION` commands
    - No additional configuration needed in the dashboard
    - Realtime works through Postgres Changes, not Replication (which is Early Access)
11. Go to **Settings** → **API** (left sidebar)
12. Copy these two values:
    - **Project URL** (looks like: `https://xxxxx.supabase.co`)
    - **anon public** key (long string starting with `eyJ...`)

## Step 2: Twitch Application Setup (2 minutes)

1. Go to [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Sign in with your Twitch account
3. Click "Register Your Application"
4. Fill in:
   - **Name**: Halloween Game Suggester
   - **OAuth Redirect URLs**: `http://localhost:3000/api/auth/callback/twitch`
   - **Category**: Website Integration
5. Click "Create"
6. Click "Manage" on your new application
7. Copy your **Client ID**
8. Click "New Secret" and copy the **Client Secret** (you can only see this once!)

**Note**: The Twitch OAuth provider in NextAuth.js automatically requests the `user:read:email` scope, which provides access to the user's Twitch ID, username, and email.

## Step 3: Get Your Twitch User ID (1 minute)

1. Go to [streamweasels.com/tools/convert-twitch-username-to-user-id](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
2. Enter your Twitch username
3. Copy the **User ID** (it's just numbers)

## Step 4: Configure Environment Variables (2 minutes)

1. Open `.env.local` in your code editor (or create it if it doesn't exist)
2. Fill in all the values:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-random-secret-here

# Twitch OAuth (from Step 2)
TWITCH_CLIENT_ID=paste-from-step-2
TWITCH_CLIENT_SECRET=paste-from-step-2

# Supabase (from Step 1)
NEXT_PUBLIC_SUPABASE_URL=paste-from-step-1
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-from-step-1

# Steam API (optional - leave empty for now)
STEAM_API_KEY=

# Streamer Configuration (from Step 3)
STREAMER_TWITCH_ID=paste-from-step-3
```

3. For `NEXTAUTH_SECRET`, generate a random string:
   - **Windows PowerShell**: 
     ```powershell
     -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
     ```
   - **Mac/Linux**: 
     ```bash
     openssl rand -base64 32
     ```
   - Or use any random 32+ character string
   - Or visit: https://generate-secret.vercel.app/32

4. **Important**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser
5. Save the file

## Step 5: Run the App (1 minute)

1. Make sure you've installed dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

4. Click "Sign in with Twitch"

5. Try suggesting a game!

### ✅ Verify Everything Works

After signing in, test these features:

1. **Game Suggestion**: 
   - Click "Suggest a Spooky Game"
   - Search for a game (e.g., "Resident Evil")
   - Submit it
   - ✓ Game should appear in the list

2. **Voting**:
   - Click the pumpkin icon on a game
   - ✓ Vote count should increase
   - Click again to remove your vote
   - ✓ Vote count should decrease

3. **Real-time Updates** (Advanced):
   - Open the app in two browser windows
   - Vote in one window
   - ✓ The other window should update automatically

4. **Streamer Controls** (If you're the streamer):
   - ✓ You should see "✓ Played" and "🗑️" buttons on games

## Step 6: Deploy to Vercel (Optional, 5 minutes)

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`!)
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add all environment variables from `.env.local`:
   - Change `NEXTAUTH_URL` to your Vercel URL (you'll get this after first deploy)
6. Click "Deploy"
7. Once deployed, copy your Vercel URL
8. Go back to Twitch Developer Console
9. Edit your application and add the production callback URL:
   - `https://your-app.vercel.app/api/auth/callback/twitch`
10. Update `NEXTAUTH_URL` in Vercel environment variables
11. Redeploy

## Troubleshooting

### "Error: Missing environment variables"
- Make sure all values in `.env.local` are filled in
- Restart the dev server after changing `.env.local`

### "Error: Failed to fetch games"
- Check that you ran the SQL schema in Supabase
- Verify your Supabase URL and key are correct
- Check the browser console for detailed errors

### "Sign in not working"
- Verify the callback URL in Twitch matches exactly: `http://localhost:3000/api/auth/callback/twitch`
- Make sure NEXTAUTH_SECRET is set and is at least 32 characters
- Clear browser cookies and try again
- Check browser console for detailed error messages
- Ensure NEXTAUTH_URL matches your current URL (http://localhost:3000 for local dev)

### "I can't see streamer controls"
- Make sure STREAMER_TWITCH_ID matches your Twitch user ID exactly
- Sign out and sign back in

### "Games not updating in real-time"
- Check that you ran the SQL schema completely (Step 1.7-1.9)
- The `ALTER PUBLICATION supabase_realtime ADD TABLE` commands in the SQL enable realtime
- Verify your Supabase connection credentials are correct
- Open browser console to see if there are WebSocket connection errors
- Check that you're using the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Look for errors like "Failed to connect to Realtime" in the console
- The app subscribes to two channels: `games-channel` and `votes-channel`
- Real-time uses WebSockets - ensure your network/firewall allows WebSocket connections
- **Note**: You don't need access to the "Replication" feature (Early Access) - realtime works via Postgres Changes

## Need Help?

- Check the main README.md for more detailed information
- Open an issue on GitHub
- Check Supabase and Twitch documentation

## What's Next?

- Customize the styling in `app/globals.css`
- Add more Halloween themes
- Invite your chat to start suggesting games!
- Share your deployment with your community

## 💡 Best Practices

### Security
- ✅ Never commit `.env.local` to Git (it's already in `.gitignore`)
- ✅ Use strong, unique secrets for `NEXTAUTH_SECRET`
- ✅ Keep your Twitch Client Secret private
- ✅ The `NEXT_PUBLIC_` prefix exposes variables to the browser - only use for non-sensitive data

### Performance
- ✅ The Steam API results are cached for 24 hours to improve performance
- ✅ Real-time subscriptions use WebSockets for efficient updates
- ✅ Database queries are optimized with proper indexes

### Development Tips
- 🔄 Restart the dev server (`npm run dev`) after changing `.env.local`
- 🌐 Test in multiple browsers to ensure compatibility
- 📱 Test on mobile devices for responsive design
- 🔍 Use browser DevTools console to debug issues
- 💾 Keep your Supabase database password safe - you'll need it to access the database directly

### Production Checklist
Before deploying to production:
- [ ] All environment variables are set in Vercel
- [ ] Twitch OAuth callback URL includes your production domain
- [ ] `NEXTAUTH_URL` points to your production URL
- [ ] Test all features in production environment
- [ ] Monitor Supabase and Vercel usage to stay within free tier limits

Happy Halloween! 🎃👻

