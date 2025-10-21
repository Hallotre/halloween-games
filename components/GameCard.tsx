'use client';

import { Game } from '@/lib/supabase';
import { SteamGameDetails } from '@/lib/steam';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface GameCardProps {
  game: Game;
  userVotes: string[];
  onVote: (gameId: string) => void;
  onUnvote: (gameId: string) => void;
  onDelete?: (gameId: string) => void;
  isStreamer: boolean;
  steamDetails?: SteamGameDetails | null;
}

export default function GameCard({
  game,
  userVotes,
  onVote,
  onUnvote,
  onDelete,
  isStreamer,
  steamDetails: propSteamDetails,
}: GameCardProps) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);
  const [steamDetails, setSteamDetails] = useState<SteamGameDetails | null>(propSteamDetails || null);
  const [loadingSteamDetails, setLoadingSteamDetails] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasVoted = userVotes.includes(game.id);

  const fetchSteamDetails = async (retryAttempt = 0) => {
    if (steamDetails || loadingSteamDetails) return;
    
    setLoadingSteamDetails(true);
    setSteamError(null);
    
    try {
      const response = await fetch(`/api/steam/details?appid=${game.steam_app_id}`);
      
      if (response.ok) {
        const details = await response.json();
        setSteamDetails(details);
        setRetryCount(0);
      } else if (response.status === 429 && retryAttempt < 3) {
        // Rate limited - retry with exponential backoff
        const retryDelay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchSteamDetails(retryAttempt + 1);
        }, retryDelay);
        return;
      } else if (response.status === 404) {
        setSteamError('Game not found on Steam');
      } else {
        setSteamError('Failed to load Steam data');
      }
    } catch (error) {
      console.error('Error fetching Steam details:', error);
      if (retryAttempt < 2) {
        // Retry on network errors
        const retryDelay = Math.pow(2, retryAttempt) * 1000;
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchSteamDetails(retryAttempt + 1);
        }, retryDelay);
        return;
      } else {
        setSteamError('Network error');
      }
    } finally {
      setLoadingSteamDetails(false);
    }
  };

  useEffect(() => {
    // Update steamDetails when prop changes
    if (propSteamDetails) {
      setSteamDetails(propSteamDetails);
    } else if (!steamDetails && !loadingSteamDetails) {
      // Only fetch if we don't have data from props
      fetchSteamDetails();
    }
  }, [game.steam_app_id, propSteamDetails]);

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
    <div className="group relative px-3 py-2 rounded-md border border-gray-700/50 bg-gray-800/60 hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-28 flex-shrink-0 bg-black overflow-hidden rounded">
          <Image
            src={game.game_image}
            alt={game.game_name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{game.game_name}</h3>
              {steamDetails && (
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {(() => {
                    if (!steamDetails.release_date || steamDetails.release_date.coming_soon) return null;
                    const raw = String(steamDetails.release_date.date || '');
                    const ts = Date.parse(raw);
                    if (!Number.isNaN(ts)) {
                      return <span>{new Date(ts).getFullYear()}</span>;
                    }
                    const match = raw.match(/\b(\d{4})\b/);
                    return match ? <span>{match[1]}</span> : null;
                  })()}
                  {steamDetails.genres && steamDetails.genres.length > 0 && (
                    <span>• {steamDetails.genres.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {/* Right-side compact badges: price + review + votes */}
              {steamDetails && !loadingSteamDetails && (
                <>
                  {/* Price (hidden on very small screens) */}
                  {(() => {
                    const p = steamDetails.price;
                    const hasDiscount = !!(p && p.final > 0 && p.discount_percent > 0 && p.initial > p.final);
                    const wrapperClass = hasDiscount
                      ? 'hidden sm:inline-flex items-center gap-2 px-2 py-0.5 rounded border border-green-600/40 bg-green-700/20 text-green-100'
                      : 'hidden sm:inline-flex items-center gap-2 px-2 py-0.5 rounded bg-gray-700/70 text-white';
                    return (
                      <span className={wrapperClass}>
                        {p ? (
                          p.final === 0 ? (
                            'Gratis'
                          ) : (
                            <>
                              {hasDiscount && (
                                <span className="line-through opacity-70">{(p.initial / 100).toFixed(0)} kr</span>
                              )}
                              <span>{(p.final / 100).toFixed(0)} kr</span>
                            </>
                          )
                        ) : 'Gratis'}
                        {hasDiscount && (
                          <span className="px-1.5 py-0.5 rounded bg-green-700/80 text-green-100">-{p!.discount_percent}%</span>
                        )}
                      </span>
                    );
                  })()}

                  {/* Review sentiment (hidden on very small screens) */}
                  {(() => {
                    const rec = steamDetails.recommendations;
                    if (!rec) return null;
                    if (rec.total > 0) {
                      const ratio = rec.positive / rec.total;
                      const color = ratio >= 0.8
                        ? 'bg-green-700/70 text-green-100'
                        : ratio >= 0.6
                        ? 'bg-yellow-700/70 text-yellow-100'
                        : 'bg-red-700/70 text-red-100';
                      const label = ratio >= 0.8 ? 'Very Positive' : ratio >= 0.6 ? 'Mostly Positive' : 'Mixed';
                      return (
                        <span className={`hidden md:inline-flex px-2 py-0.5 rounded ${color}`}>
                          {label === 'Very Positive' ? 'Veldig positive' : label === 'Mostly Positive' ? 'For det meste positive' : 'Blandet'}
                        </span>
                      );
                    }
                    if (rec.score_desc) {
                      const lower = rec.score_desc.toLowerCase();
                      const translated = lower.includes('very positive') ? 'Veldig positive' : lower.includes('mostly positive') ? 'For det meste positive' : lower.includes('mixed') ? 'Blandet' : rec.score_desc;
                      return (
                        <span className="hidden md:inline-flex px-2 py-0.5 rounded bg-gray-700/70 text-gray-200">{translated}</span>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60">
                <Image src="/media/img/POGGERS.webp" alt="Votes" width={16} height={16} className="rounded-full" />
                <span className="text-white font-semibold">{game.vote_count || 0}</span>
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleVoteClick}
              disabled={!session || isVoting}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                hasVoted
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-700 hover:bg-purple-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {hasVoted ? 'Fjern stemme' : session ? 'Stem' : 'Logg inn for å stemme'}
            </button>

            <a
              href={`steam://store/${game.steam_app_id}`}
              className="px-3 py-1.5 rounded text-sm bg-blue-700 hover:bg-blue-800 text-white"
              title="Åpne i Steam-appen"
            >
              Åpne i Steam
            </a>
            <a
              href={`https://store.steampowered.com/app/${game.steam_app_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded text-sm bg-gray-700 hover:bg-gray-600 text-white"
              title="Åpne i nettleseren"
            >
              Åpne på nett
            </a>

            {isStreamer && onDelete && (
              <button
                onClick={() => onDelete(game.id)}
                className="ml-auto px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
                title="Slett spill"
              >
                Slett
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

