'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { trackLogin } from '@/lib/analytics';

function SessionTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Track when user successfully logs in
    if (status === 'authenticated' && session?.user) {
      trackLogin('twitch');
    }
  }, [status, session]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionTracker />
      {children}
    </SessionProvider>
  );
}

