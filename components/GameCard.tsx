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
}

export default function GameCard({
  game,
  userVotes,
  onVote,
  onUnvote,
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
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-500 border border-gray-700 hover:border-purple-500 hover:-translate-y-2">

      {/* Game Image */}
      <div className="relative w-full bg-gradient-to-br from-gray-900 to-black overflow-hidden" style={{ aspectRatio: '460/215' }}>
        <Image
          src={game.game_image}
          alt={game.game_name}
          fill
          className="object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent pointer-events-none group-hover:from-purple-900/30 transition-colors duration-500"></div>

        {/* Vote Count Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 group-hover:bg-purple-900/80 group-hover:scale-110 transition-all duration-300">
          <span className="inline-block w-6 h-6 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300">
            <Image 
              src="/media/img/POGGERS.webp" 
              alt="Votes" 
              width={24} 
              height={24} 
              className="w-full h-full rounded-full object-cover" 
            />
          </span>
          <span className="text-white font-bold">{game.vote_count || 0}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
          {game.game_name}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
            <Image 
              src="https://cdn.7tv.app/emote/01H26JEK4R000651A0D191BK9M/4x.webp" 
              alt="community" 
              width={32} 
              height={32} 
              className="w-full h-full object-contain" 
            />
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
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
              hasVoted
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50'
                : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-purple-600 hover:to-orange-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-gray-700 disabled:hover:to-gray-600 disabled:hover:scale-100`}
          >
            <span className="inline-block w-8 h-8 flex-shrink-0">
              <Image 
                src="/media/img/POGGERS.webp" 
                alt="Vote" 
                width={32} 
                height={32} 
                className="w-full h-full rounded-full object-cover" 
              />
            </span>
            <span>{hasVoted ? 'Du har stemt!' : session ? 'Stem på dette' : 'Logg inn for å stemme'}</span>
          </button>

          {/* Open in Steam Button */}
          <a
            href={`steam://store/${game.steam_app_id}`}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
            title="Åpne i Steam-appen"
          >
            <span>🎮</span>
            <span>Åpne i Steam</span>
          </a>

          {isStreamer && onDelete && (
            <button
              onClick={() => onDelete(game.id)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
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

