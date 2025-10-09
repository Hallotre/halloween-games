'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gradient-to-r from-purple-900 via-purple-800 to-orange-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🎃</span>
              Halloween Game Suggester
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="text-white">Loading...</div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-white font-medium">
                    {(session.user as any)?.username || session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('twitch')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
                Sign in with Twitch
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

