# Halloween Spillforslag 🎃👻

En nettside for Twitch-chat å foreslå skumle spill for streamere å spille under Halloween! Bygget med Next.js, Supabase, og Twitch OAuth.

## Features

- 🎮 **Smart Steam Search**: Intelligent search with typo tolerance, acronym support, and fuzzy matching
- 🔐 **Twitch OAuth**: Secure authentication with Twitch accounts
- 👻 **Voting System**: One vote per user, authenticated and tracked
- ⚡ **Real-time Updates**: Live vote counts using Supabase real-time subscriptions
- 🎬 **Admin Panel**: Database-driven admin system for managing games and admins
- 👤 **User Profiles**: Personal page showing your suggestions and votes
- 🔒 **Security**: Rate limiting, input validation, RLS policies, and CSRF protection
- 🎨 **Modern UI**: Beautiful Halloween-themed design with animations
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- 🕵️ **Anonymous**: Game suggestions are anonymous to the public

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL with real-time)
- **Authentication**: NextAuth.js v4 with Twitch OAuth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Quick Setup

### 1. Prerequisites

- Node.js 18+ installed
- Twitch account
- Supabase account (free tier)
- Vercel account (for deployment)

## Production Deployment

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-random-secret-here

# Twitch OAuth
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Server (CRITICAL FOR SECURITY)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Steam API (Optional)
STEAM_API_KEY=your-steam-api-key

# Streamer Configuration
STREAMER_TWITCH_ID=your-twitch-user-id

# Analytics (Optional)
NEXT_PUBLIC_CLARITY_ID=your-clarity-project-id
NEXT_PUBLIC_GA_ID=G-7BMRKE9L79

# Production Settings
NODE_ENV=production
```

### 2. Vercel Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - In Vercel project settings, go to "Environment Variables"
   - Add all the variables from your `.env.local` file
   - Make sure to set `NEXTAUTH_URL` to your production domain

3. **Deploy**:
   - Vercel will automatically build and deploy your project
   - The build process will run `npm run build`
   - Your site will be available at `https://your-project.vercel.app`

### 3. Post-Deployment Setup

1. **Update Twitch OAuth**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console)
   - Update your application's OAuth Redirect URL to your production domain
   - Add: `https://your-domain.vercel.app/api/auth/callback/twitch`

2. **Database Setup**:
   - Run the SQL schemas in your Supabase project
   - Ensure all tables and RLS policies are created
   - Test the admin functionality

3. **Test Authentication**:
   - Visit your production site
   - Test Twitch login
   - Verify admin access works correctly

### 4. Security Checklist

- ✅ Authentication is enabled for all protected routes
- ✅ Environment variables are properly configured
- ✅ Supabase RLS policies are active
- ✅ No debug routes or console logs in production
- ✅ Security headers are configured
- ✅ HTTPS is enforced

### 2. Twitch Application Setup

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Register Your Application:
   - **Name**: Halloween Game Suggester
   - **OAuth Redirect URLs**: 
     - `http://localhost:3000/api/auth/callback/twitch` (development)
     - `https://your-domain.vercel.app/api/auth/callback/twitch` (production)
   - **Category**: Website Integration
3. Save your **Client ID** and **Client Secret**

### 3. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL schemas in order:
   - `supabase-schema.sql` (games and votes tables)
   - `supabase-admins-schema.sql` (admin system)
3. Update the initial admin in `supabase-admins-schema.sql` with your Twitch user ID
4. Get your credentials from Settings → API:
   - **Project URL**
   - **anon/public key** 
   - **service_role key** (for admin operations)

### 4. Local Development

1. Clone and install:
```bash
git clone <your-repo-url>
cd halloween-games
npm install
```

2. Create `.env.local`:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Twitch OAuth
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

4. Find your Twitch User ID at [streamweasels.com](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Production

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [Vercel](https://vercel.com/new)
   - Import your GitHub repository
   - Add all environment variables (see ENVIRONMENT_VARIABLES.md)
   - Update `NEXTAUTH_URL` to: `https://your-domain.vercel.app`
   - Click Deploy

3. **Update Twitch OAuth:**
   - Add production callback: `https://your-domain.vercel.app/api/auth/callback/twitch`

4. **Verify Deployment:**
   - [ ] Test Twitch login
   - [ ] Submit a game
   - [ ] Vote on a game
   - [ ] Check admin panel (if admin)

**Critical Variables for Production:**
```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[openssl rand -base64 32]
SUPABASE_SERVICE_ROLE_KEY=[from Supabase Dashboard]
```

## Database Schema

### Main Tables:
- **`games`**: Game suggestions with Steam integration
- **`votes`**: User votes with unique constraint
- **`admins`**: Administrator management

All tables have Row Level Security (RLS) enabled. See schema files for details.

## How to Use

### For Users:
1. Sign in with Twitch
2. Click "Foreslå et skummelt spill"
3. Search for a game (smart search with typo tolerance!)
4. Vote for your favorites 🎃
5. View your profile to see your suggestions and votes

### For Admins:
- Everything users can do, plus:
- Access admin panel (⚙️ Admin button in navbar)
- Delete inappropriate suggestions
- Add/remove other administrators
- Manage the community

## Smart Search Features

The Steam search includes:
- **Typo tolerance**: "outlats" finds "Outlast"
- **Acronyms**: "RE" finds "Resident Evil"
- **Roman numerals**: "Silent Hill 2" = "Silent Hill II"
- **Popular game boosting**: Horror games prioritized
- **Fuzzy matching**: Up to 30% character difference
- **Junk filtering**: No soundtracks or DLC clutter

## API Routes

### Games
- `GET /api/games` - Fetch all games with vote counts
- `POST /api/games` - Submit a game (auth required)
- `DELETE /api/games` - Delete a game (admin only)

### Votes  
- `GET /api/votes` - Get user's votes
- `POST /api/votes` - Vote for a game (auth required, one per game)
- `DELETE /api/votes` - Remove vote

### Admin
- `GET /api/admins` - List admins (admin only)
- `POST /api/admins` - Add admin (admin only)
- `DELETE /api/admins` - Remove admin (admin only)

### Steam
- `GET /api/steam/search?q=query` - Smart search Steam games

### User
- `GET /api/user/is-streamer` - Check if user is admin

## Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Server-side operations use service role key
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ CSRF protection middleware
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Authenticated voting (one vote per user)
- ✅ Admin-only operations verified server-side

## Troubleshooting

### Authentication Issues
- Verify environment variables are set correctly
- Check Twitch callback URLs match exactly
- Ensure NEXTAUTH_SECRET is generated
- Clear browser cookies and try again

### Database Issues
- Verify Supabase URL and keys
- Run both SQL schema files
- Check RLS policies are enabled
- Update initial admin with your Twitch user ID

### Admin Not Showing
- Verify you're in the `admins` table in Supabase
- Check Twitch user ID matches exactly
- Sign out and back in to refresh session

### Search Not Working
- Check Steam API is accessible
- Verify rate limits haven't been hit
- Try refreshing the page

## Project Structure

```
halloween-games/
├── app/
│   ├── admin/          # Admin panel page
│   ├── profile/        # User profile page
│   ├── api/            # API routes
│   └── ...             # Main page and layout
├── components/         # React components
├── lib/                # Utilities and helpers
├── middleware.ts       # Security middleware
├── supabase-schema.sql         # Main database schema
└── supabase-admins-schema.sql  # Admin table schema
```

## Environment Variables Reference

See `ENVIRONMENT_VARIABLES.md` for detailed descriptions of all required variables.

## Contributing

Issues and pull requests welcome!

## License

MIT License - feel free to use for your own! 🎃
