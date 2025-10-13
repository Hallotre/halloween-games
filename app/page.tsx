'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Game } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import GameSubmitForm from '@/components/GameSubmitForm';
import { trackPageView, trackVote, trackSearch, trackTabSwitch, trackSortingChange } from '@/lib/tracking';
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
  const [activeTab, setActiveTab] = useState<'all' | 'top5'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    
    // Track page view
    trackPageView('home', (session?.user as any)?.id);
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
        if (game) {
          trackVote(gameId, game.game_name, 'vote', (session?.user as any)?.id);
        }
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
        if (game) {
          trackVote(gameId, game.game_name, 'unvote', (session?.user as any)?.id);
        }
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

  // Filter games by search query
  const filteredGames = searchQuery.trim() 
    ? games.filter(game => 
        game.game_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;

  // Track search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      trackSearch(searchQuery, filteredGames.length, (session?.user as any)?.id);
    }
  }, [searchQuery, filteredGames.length, (session?.user as any)?.id]);

  // Get top 5 games by votes (from filtered games)
  const top5Games = [...filteredGames]
    .filter(game => (game.vote_count || 0) > 0)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 5);

  // Sort games based on selected criteria
  const sortedGames = [...filteredGames].sort((a, b) => {
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

  // Get games to display based on active tab
  const displayGames = activeTab === 'top5' ? top5Games : sortedGames;

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
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Image src="/media/img/skibenDOC.webp" alt="games" width={32} height={32} className="w-8 h-8 object-cover rounded-full" />
                  <div className="text-3xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                    {games.length}
                  </div>
                </div>
                <div className="text-gray-400 text-sm">Spill foreslått</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-gray-700/50 hover:border-orange-500/30 shadow-lg hover:shadow-xl transition-all duration-300">
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
            {/* Tab Navigation and Controls */}
            <div className="space-y-4 mb-6">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1 bg-gray-800/50 backdrop-blur rounded-lg p-1 border border-gray-700/50">
                <button
                  onClick={() => {
                    setActiveTab('all');
                    trackTabSwitch('all', (session?.user as any)?.id);
                  }}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                    <span className="flex items-center gap-2">
                      <span>🎮</span>
                      Alle Forslag
                      <span className="text-sm opacity-75">({filteredGames.length})</span>
                    </span>
                  </button>
                <button
                  onClick={() => {
                    setActiveTab('top5');
                    trackTabSwitch('top5', (session?.user as any)?.id);
                  }}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === 'top5'
                      ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                    <span className="flex items-center gap-2">
                      <span>🏆</span>
                      Top 5
                      <span className="text-sm opacity-75">({top5Games.length})</span>
                    </span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live oppdateringer
                </div>
              </div>

              {/* Search Input and Sorting */}
              <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-lg">🔍</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Søk etter spill..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800/80 text-white rounded-lg focus:outline-none transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  )}
                </div>
                
                {/* Sorting Dropdown - Only show for "All" tab */}
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm text-gray-400">Sorter etter:</label>
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => {
                        const newSortBy = e.target.value as 'votes' | 'newest' | 'oldest' | 'name';
                        setSortBy(newSortBy);
                        trackSortingChange(newSortBy, (session?.user as any)?.id);
                      }}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700/50 hover:border-purple-500/40 transition-colors cursor-pointer focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="votes">🔥 Mest stemmer</option>
                      <option value="newest">🆕 Nyeste først</option>
                      <option value="oldest">📅 Eldste først</option>
                      <option value="name">🔤 Alfabetisk</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

          {/* Empty States */}
          {activeTab === 'top5' && top5Games.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-2">Ingen spill med stemmer ennå</h3>
              <p className="text-gray-400">Stem på spill for å se topplisten!</p>
            </div>
          )}

          {/* No Search Results */}
          {searchQuery && displayGames.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">Ingen spill funnet</h3>
              <p className="text-gray-400 mb-4">Ingen spill matcher "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Tøm søk
              </button>
            </div>
          )}

          {/* Games Grid */}
          {!(activeTab === 'top5' && top5Games.length === 0 && !searchQuery) && displayGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayGames.map((game) => (
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
          )}

            {!session && (
              <div className="mt-12 text-center bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg p-8 border border-gray-700/30">
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
