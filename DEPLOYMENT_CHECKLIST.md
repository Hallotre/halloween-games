# Deployment Checklist ✅

Use this checklist to ensure everything is set up correctly before deploying to production.

## Pre-Deployment Checklist

### Supabase Setup
- [ ] Supabase project created
- [ ] SQL schema (`supabase-schema.sql`) executed successfully
- [ ] Real-time enabled for `games` and `votes` tables
- [ ] Row Level Security policies are active
- [ ] Project URL and anon key copied

### Twitch OAuth Setup
- [ ] Twitch application created at dev.twitch.tv
- [ ] Client ID and Client Secret obtained
- [ ] Local callback URL added: `http://localhost:3000/api/auth/callback/twitch`
- [ ] Twitch User ID obtained for streamer

### Local Environment
- [ ] `.env.local` file created and filled with all values
- [ ] `NEXTAUTH_SECRET` generated (32+ random characters)
- [ ] All environment variables tested locally
- [ ] `npm install` completed successfully
- [ ] `npm run dev` works without errors
- [ ] Can sign in with Twitch locally
- [ ] Can suggest a game locally
- [ ] Can vote on games locally
- [ ] Streamer controls work (if you're the streamer)
- [ ] Real-time updates work

### Code Quality
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors in browser
- [ ] All features tested and working
- [ ] Code committed to Git
- [ ] `.env.local` is in `.gitignore` (DO NOT commit secrets!)

## Vercel Deployment Steps

### 1. Push to GitHub
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] `.env.local` NOT included in repository

### 2. Import to Vercel
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)

### 3. Environment Variables
Add these in Vercel project settings → Environment Variables:

- [ ] `NEXTAUTH_URL` = `https://your-app.vercel.app` (update after first deploy)
- [ ] `NEXTAUTH_SECRET` = (same as local)
- [ ] `TWITCH_CLIENT_ID` = (same as local)
- [ ] `TWITCH_CLIENT_SECRET` = (same as local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (same as local)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (same as local)
- [ ] `STEAM_API_KEY` = (optional, same as local)
- [ ] `STREAMER_TWITCH_ID` = (same as local)

**Important**: Make sure to set these for "Production", "Preview", and "Development" environments!

### 4. First Deployment
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Copy your Vercel URL (e.g., `your-app.vercel.app`)

### 5. Update Twitch OAuth
- [ ] Go to Twitch Developer Console
- [ ] Edit your application
- [ ] Add production callback URL: `https://your-app.vercel.app/api/auth/callback/twitch`
- [ ] Save changes

### 6. Update Vercel Environment
- [ ] Go to Vercel project settings → Environment Variables
- [ ] Update `NEXTAUTH_URL` to your actual Vercel URL
- [ ] Redeploy the project (Deployments → ... → Redeploy)

### 7. Post-Deployment Testing
- [ ] Visit your production URL
- [ ] Sign in with Twitch works
- [ ] Can suggest games
- [ ] Can vote on games
- [ ] Real-time updates work
- [ ] Streamer controls work (if applicable)
- [ ] Test on mobile device
- [ ] Test in different browsers

## Custom Domain (Optional)

If you want to use your own domain:

### 1. Add Domain in Vercel
- [ ] Go to project settings → Domains
- [ ] Add your custom domain
- [ ] Follow DNS configuration instructions

### 2. Update Configurations
- [ ] Update `NEXTAUTH_URL` in Vercel to your custom domain
- [ ] Add custom domain callback to Twitch OAuth:
  - `https://yourdomain.com/api/auth/callback/twitch`
- [ ] Redeploy

### 3. Test Custom Domain
- [ ] Visit your custom domain
- [ ] Test all features again
- [ ] Verify SSL certificate is active (https)

## Troubleshooting Production Issues

### Build Fails
- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your actual URL
- Check Twitch callback URLs are correct
- Ensure `NEXTAUTH_SECRET` is set

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is not paused
- Review Supabase logs for errors

### Real-time Not Working
- Verify real-time is enabled in Supabase
- Check browser console for WebSocket errors
- Ensure RLS policies allow reading

### Streamer Controls Not Showing
- Verify `STREAMER_TWITCH_ID` is set correctly
- Check browser console for API errors
- Sign out and sign back in

## Monitoring

After deployment, monitor:

- [ ] Vercel Analytics (if enabled)
- [ ] Supabase Dashboard → Database → Tables (check data)
- [ ] Supabase Dashboard → Logs (check for errors)
- [ ] Browser console on production site
- [ ] User feedback

## Maintenance

Regular tasks:

- [ ] Monitor Supabase free tier limits (500MB database)
- [ ] Monitor Vercel free tier limits (100GB bandwidth)
- [ ] Check for Next.js updates
- [ ] Update dependencies periodically: `npm update`
- [ ] Review and moderate suggested games
- [ ] Clear old/played games if needed

## Security Notes

- ✅ Never commit `.env.local` to Git
- ✅ Never share your `NEXTAUTH_SECRET`
- ✅ Never share your Twitch Client Secret
- ✅ Never share your Supabase service role key (we only use anon key)
- ✅ Keep your dependencies updated for security patches
- ✅ Monitor Supabase logs for suspicious activity

## Support

If you encounter issues:

1. Check this checklist again
2. Review SETUP_GUIDE.md
3. Check Vercel deployment logs
4. Check Supabase logs
5. Review browser console errors
6. Check GitHub issues

## Success! 🎉

Once everything is checked off:

- [ ] Share the URL with your community
- [ ] Announce it on your stream
- [ ] Let chat start suggesting spooky games!
- [ ] Have a great Halloween stream! 🎃👻

---

**Pro Tips:**

- Test thoroughly in development before deploying
- Keep your environment variables backed up securely
- Consider setting up a staging environment for testing
- Monitor your free tier limits to avoid surprises
- Engage with your community about the new feature!

