'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Game } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import GameCard from '@/components/GameCard';
import GameSubmitForm from '@/components/GameSubmitForm';

export default function Home() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreamer, setIsStreamer] = useState(false);

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

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-6xl animate-bounce">🎃</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Spooky Season
              </h1>
              <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>👻</span>
            </div>
            <p className="text-gray-300 text-xl mb-8 max-w-3xl mx-auto">
              Stem på de skumleste spillene du vil se på stream!
            </p>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400">{games.length}</div>
                <div className="text-gray-400 text-sm">Spill foreslått</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-orange-500/20">
                <div className="text-3xl font-bold text-orange-400">{totalVotes}</div>
                <div className="text-gray-400 text-sm">Totale stemmer</div>
              </div>
            </div>

            <GameSubmitForm onGameSubmitted={fetchGames} />

            {/* Leading Game Banner */}
            {topGame && (topGame.vote_count || 0) > 0 && (
              <div className="mt-8 bg-gradient-to-r from-purple-900/40 to-orange-900/40 backdrop-blur rounded-lg p-6 border border-purple-500/30 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl">👑</span>
                  <h3 className="text-xl font-bold text-white">Leder: {topGame.game_name}</h3>
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
            <div className="inline-block animate-spin text-6xl mb-4">🎃</div>
            <p className="text-white text-xl">Laster grøsserspill...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">👻</div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🎮</span>
                Alle Forslag
                <span className="text-gray-500 text-lg font-normal">({games.length})</span>
              </h2>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live oppdateringer aktivert
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  userVotes={userVotes}
                  onVote={handleVote}
                  onUnvote={handleUnvote}
                  onDelete={isStreamer ? handleDelete : undefined}
                  isStreamer={isStreamer}
                  rank={index + 1}
                />
              ))}
            </div>

            {!session && (
              <div className="mt-12 text-center bg-gradient-to-r from-purple-900/20 to-orange-900/20 rounded-lg p-8 border border-purple-500/20">
                <p className="text-gray-300 text-lg mb-4">
                  <span className="text-2xl mr-2">🎃</span>
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
