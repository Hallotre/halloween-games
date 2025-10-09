# Supabase Realtime Explanation 🔄

## Important: You Don't Need "Replication" Access!

If you see "Replication" listed as Early Access in your Supabase dashboard, **don't worry** - you don't need it for this app to work.

## How Realtime Works in This App

### Two Different Features (Often Confused)

1. **Realtime (Postgres Changes)** ✅ - What we use
   - Available to everyone
   - Enabled via SQL commands
   - Listens to database changes via `postgres_changes`
   - Uses WebSockets
   - **This is what the app uses!**

2. **Replication** ❌ - What you don't need
   - Early Access feature
   - For database replication/backups
   - Not required for real-time updates
   - Different feature entirely

## What the SQL Schema Does

When you run `supabase-schema.sql`, these lines enable realtime:

```sql
-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
```

These commands:
- Add the tables to Supabase's realtime publication
- Enable the app to listen for INSERT, UPDATE, DELETE events
- Work automatically - no dashboard configuration needed
- Don't require "Replication" feature access

## How the App Uses Realtime

In `app/page.tsx`, the app subscribes to changes:

```typescript
// Subscribe to games changes
const gamesSubscription = supabase
  .channel('games-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'games' },
    () => {
      fetchGames();
    }
  )
  .subscribe();

// Subscribe to votes changes
const votesSubscription = supabase
  .channel('votes-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'votes' },
    () => {
      fetchGames();
      fetchUserVotes();
    }
  )
  .subscribe();
```

This uses **Postgres Changes**, not Replication!

## Verifying Realtime is Working

### Method 1: Test in the App
1. Open the app in two browser windows
2. Vote on a game in one window
3. The other window should update automatically
4. ✅ If it updates, realtime is working!

### Method 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages like:
   - ✅ `Realtime subscription connected`
   - ✅ WebSocket connection established
   - ❌ `Failed to connect to Realtime` (means there's an issue)

### Method 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. ✅ You should see a WebSocket connection to Supabase

## Common Issues (Not Related to Replication)

### Issue: "Can't find Replication in dashboard"
**Solution**: You don't need it! The SQL commands handle everything.

### Issue: "Realtime not working"
**Check**:
- Did you run the complete SQL schema?
- Are your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` correct?
- Is your network/firewall blocking WebSockets?
- Check browser console for errors

### Issue: "Do I need to enable anything in the dashboard?"
**Answer**: No! The SQL schema enables everything automatically.

## Technical Details

### What is `supabase_realtime` Publication?

Supabase creates a PostgreSQL publication called `supabase_realtime` automatically. When you run:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

You're telling PostgreSQL: "Include changes to the `games` table in the realtime publication."

The Supabase client library then:
1. Connects via WebSocket
2. Subscribes to the publication
3. Receives change events
4. Triggers your callback functions

### Why Two Channels?

The app uses two separate channels:
- `games-channel` - for game additions, updates, deletions
- `votes-channel` - for vote additions and removals

This allows fine-grained control over what updates trigger what actions.

## Free Tier Limits

Supabase Free Tier includes:
- ✅ Unlimited realtime connections (with reasonable use)
- ✅ 2GB database storage
- ✅ 500MB database size
- ✅ 50,000 monthly active users

Realtime is **fully included** in the free tier!

## Summary

- ✅ **Realtime works without "Replication" access**
- ✅ **SQL schema enables everything automatically**
- ✅ **No dashboard configuration needed**
- ✅ **Uses Postgres Changes, not Replication**
- ✅ **Fully included in free tier**

If realtime updates are working in your app, you're all set! The "Replication" feature in Early Access is something completely different.

---

**Still having issues?** Check the troubleshooting section in `SETUP_GUIDE.md` or open an issue on GitHub.

