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

  const handleMarkPlayed = async (gameId: string, isPlayed: boolean) => {
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game_id: gameId, is_played: isPlayed }),
      });

      if (response.ok) {
        await fetchGames();
      }
    } catch (error) {
      console.error('Error marking game as played:', error);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) {
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

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            🎃 Spooky Game Suggestions 👻
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            Vote for the scariest games you want to see on stream this Halloween!
          </p>
          <GameSubmitForm onGameSubmitted={fetchGames} />
        </div>

        {isLoading ? (
          <div className="text-center text-white text-xl">
            Loading games...
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 text-xl">
            No games suggested yet. Be the first to suggest a spooky game!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                userVotes={userVotes}
                onVote={handleVote}
                onUnvote={handleUnvote}
                onMarkPlayed={isStreamer ? handleMarkPlayed : undefined}
                onDelete={isStreamer ? handleDelete : undefined}
                isStreamer={isStreamer}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
