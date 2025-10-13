'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Game {
  id: string;
  steam_app_id: number;
  game_name: string;
  game_image: string;
  suggested_by: string;
  created_at: string;
  vote_count?: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestedGames, setSuggestedGames] = useState<Game[]>([]);
  const [votedGames, setVotedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return;

      try {
        const userId = (session.user as any).id;
        const username = (session.user as any).username || session.user.name;

        // Fetch games suggested by this user
        const gamesResponse = await fetch('/api/games');
        const allGames = await gamesResponse.json();
        const userSuggested = allGames.filter((game: Game) => game.suggested_by === username);
        setSuggestedGames(userSuggested);

        // Fetch user's votes
        const votesResponse = await fetch('/api/votes');
        const userVotes = await votesResponse.json();
        
        // Get the games that the user voted for
        const votedGameIds = userVotes.map((vote: any) => vote.game_id);
        const userVotedGames = allGames.filter((game: Game) => votedGameIds.includes(game.id));
        setVotedGames(userVotedGames);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-6xl mb-4">👤</div>
          <p className="text-white text-xl">Laster profil...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const username = (session.user as any)?.username || session.user?.name || 'Bruker';

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={username}
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-purple-500"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                  {username[0].toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-5xl font-bold text-white mb-2">
              {username}
            </h1>
            <p className="text-gray-300 text-xl">
              Din personlige profil
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400">{suggestedGames.length}</div>
                <div className="text-gray-400 text-sm">Spill foreslått</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-orange-500/20">
                <div className="text-3xl font-bold text-orange-400">{votedGames.length}</div>
                <div className="text-gray-400 text-sm">Stemmer avgitt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Suggested Games */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🎮</span>
              <h2 className="text-2xl font-bold text-white">
                Dine foreslåtte spill
              </h2>
              <div className="bg-purple-600/30 px-3 py-1 rounded-full border border-purple-500/50 ml-auto">
                <span className="text-white font-bold">{suggestedGames.length}</span>
              </div>
            </div>

            {suggestedGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 inline-block w-20 h-20">
                  <Image src="/media/img/skibenDOC.webp" alt="No suggestions" width={80} height={80} className="w-full h-full rounded-full object-cover" />
                </div>
                <p className="text-gray-400 text-lg">Du har ikke foreslått noen spill ennå</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Foreslå et spill nå
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {suggestedGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gray-700/50 rounded-xl overflow-hidden border border-gray-600 hover:border-purple-500/50 transition-all flex"
                  >
                    <div className="relative h-24 w-32 flex-shrink-0 bg-black">
                      <Image
                        src={game.game_image}
                        alt={game.game_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3 flex-1 min-w-0">
                      <h3 className="text-white font-bold mb-1 line-clamp-2 text-sm">{game.game_name}</h3>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {new Date(game.created_at).toLocaleDateString('no-NO')}
                        </span>
                        <span className="text-purple-400 font-bold flex items-center gap-1">
                          <span className="inline-block w-5 h-5 flex-shrink-0">
                            <Image src="/media/img/POGGERS.webp" alt="Votes" width={20} height={20} className="w-full h-full rounded-full object-cover" />
                          </span>
                          <span>{game.vote_count || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voted Games */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/30 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-block w-10 h-10 flex-shrink-0">
                <Image src="/media/img/skibenDEVIL.webp" alt="Devil" width={40} height={40} className="w-full h-full rounded-full object-cover" />
              </span>
              <h2 className="text-2xl font-bold text-white">
                Spill du har stemt på
              </h2>
              <div className="bg-orange-600/30 px-3 py-1 rounded-full border border-orange-500/50 ml-auto">
                <span className="text-white font-bold">{votedGames.length}</span>
              </div>
            </div>

            {votedGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 inline-block w-20 h-20">
                  <Image src="/media/img/skibenDEVIL.webp" alt="No votes" width={80} height={80} className="w-full h-full rounded-full object-cover" />
                </div>
                <p className="text-gray-400 text-lg">Du har ikke stemt på noen spill ennå</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Gå til hovedsiden
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {votedGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gray-700/50 rounded-xl overflow-hidden border border-gray-600 hover:border-orange-500/50 transition-all flex"
                  >
                    <div className="relative h-24 w-32 flex-shrink-0 bg-black">
                      <Image
                        src={game.game_image}
                        alt={game.game_name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3 flex-1 min-w-0">
                      <h3 className="text-white font-bold mb-1 line-clamp-2 text-sm">{game.game_name}</h3>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {new Date(game.created_at).toLocaleDateString('no-NO')}
                        </span>
                        <span className="text-orange-400 font-bold flex items-center gap-1">
                          <span className="inline-block w-5 h-5 flex-shrink-0">
                            <Image src="/media/img/POGGERS.webp" alt="Votes" width={20} height={20} className="w-full h-full rounded-full object-cover" />
                          </span>
                          <span>{game.vote_count || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>Tilbake til hovedsiden</span>
          </button>
        </div>
      </div>
    </main>
  );
}

