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
  onDelete?: (gameId: string) => void;
  isStreamer: boolean;
  rank: number;
}

export default function GameCard({
  game,
  userVotes,
  onVote,
  onUnvote,
  onDelete,
  isStreamer,
  rank,
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

  const getRankBadge = () => {
    if (rank === 1) return { emoji: '🥇', color: 'from-yellow-500 to-yellow-600', text: '#1' };
    if (rank === 2) return { emoji: '🥈', color: 'from-gray-400 to-gray-500', text: '#2' };
    if (rank === 3) return { emoji: '🥉', color: 'from-orange-600 to-orange-700', text: '#3' };
    return { emoji: '🎮', color: 'from-gray-600 to-gray-700', text: `#${rank}` };
  };

  const rankBadge = getRankBadge();

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500/50 hover:scale-105">
      {/* Rank Badge */}
      <div className={`absolute top-3 left-3 z-10 bg-gradient-to-br ${rankBadge.color} px-3 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
        <span>{rankBadge.emoji}</span>
        <span className="text-white font-bold text-sm">{rankBadge.text}</span>
      </div>

      {/* Game Image */}
      <div className="relative h-52 w-full bg-gradient-to-br from-gray-900 to-black overflow-hidden">
        <Image
          src={game.game_image}
          alt={game.game_name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

        {/* Vote Count Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
          <span className="text-xl">{hasVoted ? '👻' : '🎃'}</span>
          <span className="text-white font-bold">{game.vote_count || 0}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {game.game_name}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-sm">Foreslått av et community medlem</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleVoteClick}
            disabled={!session || isVoting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
              hasVoted
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/30'
                : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-purple-600 hover:to-orange-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-gray-700 disabled:hover:to-gray-600`}
          >
            <span className="text-2xl">{hasVoted ? '👻' : '🎃'}</span>
            <span>{hasVoted ? 'Du har stemt!' : session ? 'Stem på dette' : 'Logg inn for å stemme'}</span>
          </button>

          {isStreamer && onDelete && (
            <button
              onClick={() => onDelete(game.id)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              title="Slett spill"
            >
              <span>🗑️</span>
              <span>Slett spill</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

