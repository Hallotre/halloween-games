'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Game } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import GameSubmitForm from '@/components/GameSubmitForm';
import { trackVote } from '@/lib/analytics';
import Image from 'next/image';
import { motion } from 'motion/react';
import FloatingEmotes from '@/components/FloatingEmotes';

export default function Home() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreamer, setIsStreamer] = useState(false);
  const [sortBy, setSortBy] = useState<'votes' | 'newest' | 'oldest' | 'name'>('votes');

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      
      // Check if there's an error response
      if (data.error) {
        console.error('API error:', data.error);
        setGames([]);
        return;
      }
      
      // Check if data is an array before sorting
      if (Array.isArray(data)) {
        // Sort by vote count (highest first), then by created date
        const sortedGames = data.sort((a: Game, b: Game) => {
          const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
          if (voteDiff !== 0) return voteDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setGames(sortedGames);
      } else {
        console.error('API returned non-array data:', data);
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    }
  };

  const fetchUserVotes = async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/votes');
      const data = await response.json();
      setUserVotes(data.map((vote: any) => vote.game_id));
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchGames();
      await fetchUserVotes();
      setIsLoading(false);
    };

    loadData();
  }, [session]);

  useEffect(() => {
    const checkStreamerStatus = async () => {
      if (!session) {
        setIsStreamer(false);
        return;
      }

      try {
        const response = await fetch('/api/user/is-streamer');
        const data = await response.json();
        setIsStreamer(data.isStreamer);
      } catch (error) {
        console.error('Error checking streamer status:', error);
        setIsStreamer(false);
      }
    };

    checkStreamerStatus();
  }, [session]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not available. Real-time features disabled.');
      return;
    }

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

    return () => {
      supabase.removeChannel(gamesSubscription);
      supabase.removeChannel(votesSubscription);
    };
  }, [session]);

  const handleVote = async (gameId: string) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      if (response.ok) {
        setUserVotes([...userVotes, gameId]);
        await fetchGames();
        
        // Track vote event
        const game = games.find(g => g.id === gameId);
        trackVote('vote', game?.game_name);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleUnvote = async (gameId: string) => {
    try {
      const response = await fetch(`/api/votes?game_id=${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserVotes(userVotes.filter(id => id !== gameId));
        await fetchGames();
        
        // Track unvote event
        const game = games.find(g => g.id === gameId);
        trackVote('unvote', game?.game_name);
      }
    } catch (error) {
      console.error('Error unvoting:', error);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette spillet?')) {
      return;
    }

    try {
      const response = await fetch(`/api/games?game_id=${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGames();
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const totalVotes = games.reduce((sum, game) => sum + (game.vote_count || 0), 0);
  const topGame = games.length > 0 ? games[0] : null;

  // Sort games based on selected criteria
  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        const voteDiff = (b.vote_count || 0) - (a.vote_count || 0);
        if (voteDiff !== 0) return voteDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return a.game_name.localeCompare(b.game_name);
      default:
        return 0;
    }
  });

  return (
    <main className="min-h-screen relative">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900/50 via-orange-900/30 to-transparent relative overflow-hidden">
        {/* Floating emotes with Motion.dev for hardware-accelerated animations */}
        <FloatingEmotes />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="animate-bounce w-16 h-16 flex-shrink-0 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">
                <Image src="/media/img/skibenDOC.webp" alt="Doc Skiben" width={64} height={64} className="w-full h-full rounded-full object-cover" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white spooky-text">
                Spooky Season
              </h1>
              <div className="animate-bounce w-16 h-16 flex-shrink-0 drop-shadow-[0_0_15px_rgba(234,88,12,0.8)]" style={{ animationDelay: '0.2s' }}>
                <Image src="/media/img/skibenDEVIL.webp" alt="Devil Skiben" width={64} height={64} className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <p className="text-gray-300 text-xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
              Stem på de skumleste spillene du vil se på stream!
            </p>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Image src="/media/img/skibenDOC.webp" alt="games" width={32} height={32} className="w-8 h-8 object-cover rounded-full" />
                  <div className="text-3xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                    {games.length}
                  </div>
                </div>
                <div className="text-gray-400 text-sm">Spill foreslått</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-orange-500/20 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Image src="/media/img/POGGERS.webp" alt="votes" width={32} height={32} className="w-8 h-8 object-cover rounded-full" />
                  <div className="text-3xl font-bold text-orange-400 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]">
                    {totalVotes}
                  </div>
                </div>
                <div className="text-gray-400 text-sm">Totale stemmer</div>
              </div>
            </div>

          <GameSubmitForm onGameSubmitted={fetchGames} />

            {/* Leading Game Banner */}
            {topGame && (topGame.vote_count || 0) > 0 && (
              <div className="mt-8 bg-gradient-to-r from-purple-900/40 to-orange-900/40 backdrop-blur rounded-lg p-6 border border-purple-500/30 max-w-2xl mx-auto shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all duration-500 relative overflow-hidden">
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 rounded-lg opacity-30 pointer-events-none" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite'
                }}></div>
                
                <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
                  <div className="animate-bounce w-8 h-8" style={{ animationDuration: '2s' }}>
                    <Image src="/media/img/skibenDEVIL.webp" alt="leader" width={32} height={32} className="w-full h-full object-cover rounded-full drop-shadow-[0_0_15px_rgba(234,88,12,0.9)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">Leder: {topGame.game_name}</h3>
                  <div className="animate-bounce w-8 h-8" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>
                    <Image src="/media/img/skibenDEVIL.webp" alt="leader" width={32} height={32} className="w-full h-full object-cover rounded-full drop-shadow-[0_0_15px_rgba(234,88,12,0.9)]" />
                  </div>
                </div>
                <p className="text-gray-300">
                  <span className="text-purple-400 font-bold">{topGame.vote_count}</span> stemmer
                </p>
              </div>
            )}
          </div>
        </div>
        </div>

      {/* Games Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-24 h-24">
              <Image src="/media/img/skibenDOC.webp" alt="Loading" width={96} height={96} className="w-full h-full rounded-full object-cover" />
            </div>
            <p className="text-white text-xl">Laster grøsserspill...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6 inline-block w-32 h-32">
              <Image src="/media/img/skibenDEVIL.webp" alt="No games" width={128} height={128} className="w-full h-full rounded-full object-cover" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Ingen spill ennå!
            </h3>
            <p className="text-gray-400 text-xl mb-8">
              Vær den første til å foreslå et skummelt spill
            </p>
            {!session && (
              <p className="text-gray-500">
                Logg inn med Twitch for å foreslå spill
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🎮</span>
                Alle Forslag
                <span className="text-gray-500 text-lg font-normal">({games.length})</span>
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Sorting Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-gray-400">Sorter etter:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'votes' | 'newest' | 'oldest' | 'name')}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer focus:outline-none focus:border-purple-500"
                  >
                    <option value="votes">🔥 Mest stemmer</option>
                    <option value="newest">🆕 Nyeste først</option>
                    <option value="oldest">📅 Eldste først</option>
                    <option value="name">🔤 Alfabetisk</option>
                  </select>
                </div>

                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live oppdateringer
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  userVotes={userVotes}
                  onVote={handleVote}
                  onUnvote={handleUnvote}
                  onDelete={isStreamer ? handleDelete : undefined}
                  isStreamer={isStreamer}
                />
              ))}
          </div>

            {!session && (
              <div className="mt-12 text-center bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg p-8 border border-purple-500/20">
                <p className="text-gray-300 text-lg mb-4 flex items-center justify-center gap-2">
                  <span className="inline-block w-8 h-8 flex-shrink-0">
                    <Image src="/media/img/skibenDOC.webp" alt="Doc Skiben" width={32} height={32} className="w-full h-full rounded-full object-cover" />
                  </span>
                  Logg inn med Twitch for å stemme på dine favorittspill!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
