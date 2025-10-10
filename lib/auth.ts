import { NextAuthOptions } from 'next-auth';
import TwitchProvider from 'next-auth/providers/twitch';

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    TwitchProvider({
      clientId: process.env.AUTH_TWITCH_ID || process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.AUTH_TWITCH_SECRET || process.env.TWITCH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'user:read:email',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account && profile) {
        token.id = profile.sub;
        token.username = (profile as any).preferred_username;
        token.image = (profile as any).picture;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
