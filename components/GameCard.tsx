'use client';

import { Game } from '@/lib/supabase';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

interface GameCardProps {
  game: Game;
  userVotes: string[];
  onVote: (gameId: string) => void;
  onUnvote: (gameId: string) => void;
  onMarkPlayed?: (gameId: string, isPlayed: boolean) => void;
  onDelete?: (gameId: string) => void;
  isStreamer: boolean;
}

export default function GameCard({
  game,
  userVotes,
  onVote,
  onUnvote,
  onMarkPlayed,
  onDelete,
  isStreamer,
}: GameCardProps) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);
  const hasVoted = userVotes.includes(game.id);

  const handleVoteClick = async () => {
    if (!session) return;
    
    setIsVoting(true);
    try {
      if (hasVoted) {
        await onUnvote(game.id);
      } else {
        await onVote(game.id);
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow ${game.is_played ? 'opacity-60' : ''}`}>
      <div className="relative h-48 w-full bg-gray-900">
        <Image
          src={game.game_image}
          alt={game.game_name}
          fill
          className="object-cover"
          unoptimized
        />
        {game.is_played && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">✓ PLAYED</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {game.game_name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-sm">
            Suggested by <span className="text-purple-400 font-medium">{game.suggested_by}</span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleVoteClick}
            disabled={!session || isVoting || game.is_played}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasVoted
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-xl">{hasVoted ? '👻' : '🎃'}</span>
            <span>{game.vote_count || 0}</span>
          </button>

          {isStreamer && (
            <div className="flex gap-2">
              {onMarkPlayed && (
                <button
                  onClick={() => onMarkPlayed(game.id, !game.is_played)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    game.is_played
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {game.is_played ? '↩️ Unmark' : '✓ Played'}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(game.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

