# Halloween Game Suggester 🎃👻

A web app for Twitch chat to suggest spooky games for streamers to play during Halloween! Built with Next.js, Supabase, and Twitch OAuth.

> **📚 New here?** Check out the [Documentation Index](DOCUMENTATION_INDEX.md) for a complete guide to all documentation files, or jump straight to the [Quick Start Guide](QUICK_START.md) to get running in 5 minutes!

## Features

- 🎮 **Steam Game Integration**: Search and validate games directly from Steam
- 🔐 **Twitch OAuth**: Secure authentication with Twitch accounts
- 👻 **Voting System**: Users can vote for their favorite game suggestions
- ⚡ **Real-time Updates**: Live vote counts using Supabase real-time subscriptions
- 🎬 **Streamer Controls**: Mark games as played or remove suggestions
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with real-time)
- **Authentication**: NextAuth.js with Twitch OAuth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Twitch account
- A Supabase account (free tier works!)
- A Vercel account (for deployment)

### 2. Twitch Application Setup

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Click "Register Your Application"
3. Fill in the details:
   - **Name**: Halloween Game Suggester (or any name)
   - **OAuth Redirect URLs**: 
     - `http://localhost:3000/api/auth/callback/twitch` (for local development)
     - `https://your-domain.vercel.app/api/auth/callback/twitch` (for production)
   - **Category**: Website Integration
4. Save your **Client ID** and **Client Secret**

### 3. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to the SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project credentials:
   - Go to Settings → API
   - Copy the **Project URL** and **anon/public key**

### 4. Local Development Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd halloween-games
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the root directory:
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Twitch OAuth
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Steam API (optional - most endpoints work without it)
STEAM_API_KEY=your-steam-api-key

# Streamer Configuration (your Twitch user ID)
STREAMER_TWITCH_ID=your-twitch-user-id
```

4. Generate a random secret for NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

5. Find your Twitch User ID:
   - Sign in to Twitch
   - Go to https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
   - Enter your username and copy the User ID

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### 5. Deployment to Vercel

1. Push your code to GitHub

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add all environment variables from `.env.local` to Vercel:
   - Update `NEXTAUTH_URL` to your production URL
   - Add the production callback URL to your Twitch app settings

4. Deploy!

## Database Schema

The app uses two main tables:

### `games` table
- Stores all suggested games
- Includes Steam app ID, game name, image, and who suggested it
- Tracks if a game has been played

### `votes` table
- Stores user votes for games
- Prevents duplicate votes with unique constraint
- Links to games table via foreign key

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## How to Use

### For Viewers:
1. Sign in with your Twitch account
2. Click "Suggest a Spooky Game"
3. Search for a Steam game
4. Submit your suggestion
5. Vote for your favorite games by clicking the pumpkin icon 🎃

### For Streamers:
- All viewer features, plus:
- Mark games as "Played" when you've completed them
- Delete inappropriate or duplicate suggestions
- Games are sorted by vote count automatically

## API Routes

- `GET /api/games` - Fetch all games with vote counts
- `POST /api/games` - Submit a new game (requires auth)
- `PATCH /api/games` - Mark game as played (streamer only)
- `DELETE /api/games` - Delete a game (streamer only)
- `GET /api/votes` - Get current user's votes
- `POST /api/votes` - Vote for a game
- `DELETE /api/votes` - Remove vote
- `GET /api/steam/search` - Search Steam games

## Real-time Features

The app uses Supabase real-time subscriptions to automatically update:
- New game suggestions appear instantly
- Vote counts update live for all users
- No page refresh needed!

## Troubleshooting

### "Unauthorized" errors
- Make sure you're signed in with Twitch
- Check that your environment variables are set correctly

### Games not appearing
- Check browser console for errors
- Verify Supabase connection
- Ensure the database schema is set up correctly

### Twitch OAuth not working
- Verify callback URLs match exactly in Twitch developer console
- Check NEXTAUTH_URL is set correctly
- Make sure NEXTAUTH_SECRET is set

### Streamer controls not showing
- Verify STREAMER_TWITCH_ID matches your Twitch user ID
- Sign out and sign back in to refresh your session

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT License - feel free to use this for your own streams!
