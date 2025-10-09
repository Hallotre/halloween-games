# Project Structure 📁

This document explains the organization and purpose of each file and directory in the Halloween Game Suggester project.

## Root Directory

```
halloween-games/
├── app/                      # Next.js App Router directory
├── components/               # React components
├── lib/                      # Utility libraries and helpers
├── public/                   # Static assets
├── node_modules/            # Dependencies (auto-generated)
├── .env.local               # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── DEPLOYMENT_CHECKLIST.md  # Deployment guide
├── FEATURES.md              # Feature list and roadmap
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies
├── postcss.config.mjs       # PostCSS configuration
├── PROJECT_STRUCTURE.md     # This file
├── README.md                # Main documentation
├── SETUP_GUIDE.md           # Quick setup instructions
├── supabase-schema.sql      # Database schema
├── tsconfig.json            # TypeScript configuration
└── vercel.json              # Vercel deployment config
```

## `/app` Directory

Next.js 14 App Router structure with server and client components.

### `/app/api` - API Routes

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts         # NextAuth.js configuration
├── games/
│   └── route.ts             # Game CRUD operations
├── steam/
│   └── search/
│       └── route.ts         # Steam game search
├── user/
│   └── is-streamer/
│       └── route.ts         # Check streamer status
└── votes/
    └── route.ts             # Voting operations
```

**API Route Details:**

- **`auth/[...nextauth]/route.ts`**
  - Configures NextAuth.js with Twitch OAuth
  - Handles JWT and session callbacks
  - Exports GET and POST handlers

- **`games/route.ts`**
  - `GET`: Fetch all games with vote counts
  - `POST`: Submit new game (requires auth)
  - `PATCH`: Mark game as played (streamer only)
  - `DELETE`: Remove game (streamer only)

- **`votes/route.ts`**
  - `GET`: Fetch current user's votes
  - `POST`: Add vote to a game
  - `DELETE`: Remove vote from a game

- **`steam/search/route.ts`**
  - `GET`: Search Steam games by query
  - Returns up to 10 matching results

- **`user/is-streamer/route.ts`**
  - `GET`: Check if current user is the streamer
  - Returns boolean flag

### `/app` - Pages and Layout

```
app/
├── layout.tsx               # Root layout with providers
├── page.tsx                 # Main page (game list)
├── globals.css              # Global styles
└── favicon.ico              # Site favicon
```

**Page Details:**

- **`layout.tsx`**
  - Root layout component
  - Wraps app with SessionProvider
  - Includes Navbar component
  - Sets up global styling

- **`page.tsx`**
  - Main application page
  - Displays game list with voting
  - Handles real-time subscriptions
  - Manages user interactions

## `/components` Directory

Reusable React components.

```
components/
├── GameCard.tsx             # Individual game display card
├── GameSubmitForm.tsx       # Game submission modal
├── Navbar.tsx               # Navigation bar with auth
└── Providers.tsx            # Session provider wrapper
```

**Component Details:**

- **`GameCard.tsx`**
  - Props: game, userVotes, callbacks, isStreamer
  - Displays game image, name, vote count
  - Handles voting interactions
  - Shows streamer controls conditionally

- **`GameSubmitForm.tsx`**
  - Modal form for submitting games
  - Steam game search with autocomplete
  - Debounced search (300ms)
  - Validates game before submission

- **`Navbar.tsx`**
  - Top navigation bar
  - Twitch sign in/out button
  - User profile display
  - Responsive design

- **`Providers.tsx`**
  - Wraps app with NextAuth SessionProvider
  - Client component for auth context

## `/lib` Directory

Utility functions and library configurations.

```
lib/
├── steam.ts                 # Steam API integration
└── supabase.ts              # Supabase client setup
```

**Library Details:**

- **`steam.ts`**
  - `getSteamAppList()`: Fetch and cache Steam game list
  - `searchSteamGames()`: Search games by query
  - `getSteamGameDetails()`: Get detailed game info
  - `isValidSteamAppId()`: Validate Steam app ID
  - Includes 24-hour caching for app list

- **`supabase.ts`**
  - Creates and exports Supabase client
  - TypeScript types for Game and Vote
  - Used by both client and server code

## Configuration Files

### `next.config.ts`
Next.js configuration (default settings).

### `tsconfig.json`
TypeScript compiler options:
- Strict mode enabled
- Path aliases (@/* → ./*)
- JSX support for React

### `tailwind.config.ts`
Tailwind CSS configuration:
- Content paths for purging
- Theme customization
- Plugin configuration

### `postcss.config.mjs`
PostCSS configuration for Tailwind CSS.

### `vercel.json`
Vercel deployment configuration:
- Build command
- Framework detection
- Environment variable references

### `package.json`
Project metadata and dependencies:
- Scripts: dev, build, start, lint
- Dependencies: Next.js, React, NextAuth, Supabase, Axios
- Dev dependencies: TypeScript, Tailwind CSS

## Documentation Files

### `README.md`
Main project documentation:
- Features overview
- Tech stack
- Setup instructions
- API documentation
- Troubleshooting

### `SETUP_GUIDE.md`
Quick start guide:
- Step-by-step setup (10 minutes)
- Supabase configuration
- Twitch OAuth setup
- Environment variables
- Local testing

### `DEPLOYMENT_CHECKLIST.md`
Production deployment guide:
- Pre-deployment checklist
- Vercel setup steps
- Post-deployment testing
- Troubleshooting
- Monitoring

### `FEATURES.md`
Feature documentation:
- Current features
- Future enhancements
- Implementation priorities
- Contribution guidelines

### `PROJECT_STRUCTURE.md`
This file - explains project organization.

## Database Schema

### `supabase-schema.sql`
Complete database setup:
- Tables: games, votes
- Indexes for performance
- Row Level Security policies
- Real-time subscriptions
- Helpful comments

## Environment Variables

### `.env.local` (not in git)
Local development environment variables:
- NextAuth configuration
- Twitch OAuth credentials
- Supabase connection
- Steam API key (optional)
- Streamer Twitch ID

### `.env.example`
Template for environment variables:
- Shows required variables
- Includes placeholder values
- Safe to commit to git

## Public Assets

### `/public`
Static files served at root:
- SVG icons (Next.js defaults)
- Can add custom images here
- Accessible at `/filename.ext`

## Generated Files (Not in Git)

### `/node_modules`
Installed npm packages (auto-generated).

### `/.next`
Next.js build output (auto-generated).

### `/next-env.d.ts`
Next.js TypeScript declarations (auto-generated).

### `package-lock.json`
Locked dependency versions (auto-generated).

## File Naming Conventions

- **Components**: PascalCase (e.g., `GameCard.tsx`)
- **API Routes**: lowercase (e.g., `route.ts`)
- **Utilities**: lowercase (e.g., `steam.ts`)
- **Config Files**: lowercase with extension (e.g., `next.config.ts`)
- **Documentation**: UPPERCASE.md (e.g., `README.md`)

## Code Organization Principles

1. **Separation of Concerns**
   - API routes handle business logic
   - Components handle presentation
   - Lib files handle utilities

2. **Type Safety**
   - TypeScript throughout
   - Shared types in lib files
   - Strict mode enabled

3. **Reusability**
   - Components are modular
   - Utilities are pure functions
   - Styles use Tailwind classes

4. **Security**
   - Environment variables for secrets
   - Server-side auth checks
   - RLS policies in database

5. **Performance**
   - Caching where appropriate
   - Real-time subscriptions
   - Optimized queries

## Adding New Features

When adding new features, follow this structure:

1. **API Route**: Add to `/app/api/[feature]/route.ts`
2. **Component**: Add to `/components/FeatureName.tsx`
3. **Utility**: Add to `/lib/feature.ts` if needed
4. **Types**: Add to relevant lib file
5. **Documentation**: Update relevant .md files

## Best Practices

- Keep components small and focused
- Use TypeScript types consistently
- Handle errors gracefully
- Add loading states
- Test on mobile
- Document complex logic
- Follow existing patterns

## Questions?

If you're unsure where something should go:
1. Look at similar existing code
2. Follow Next.js conventions
3. Keep related code together
4. Ask in GitHub discussions

---

**Happy coding! 🎃👻**

