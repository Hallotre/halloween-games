'use client';

import { SteamGame } from '@/lib/steam';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface GameSubmitFormProps {
  onGameSubmitted: () => void;
}

export default function GameSubmitForm({ onGameSubmitted }: GameSubmitFormProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SteamGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);
  const [gameImages, setGameImages] = useState<{ [key: number]: string }>({});
  const [suggestedGames, setSuggestedGames] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch already suggested games
    const fetchSuggestedGames = async () => {
      try {
        const response = await fetch('/api/games');
        if (response.ok) {
          const games = await response.json();
          const appIds = games.map((g: any) => g.steam_app_id).filter(Boolean);
          setSuggestedGames(appIds);
        }
      } catch (err) {
        console.error('Error fetching suggested games:', err);
      }
    };
    fetchSuggestedGames();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const response = await fetch(`/api/steam/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data);
        
        // Fetch images for top results
        data.slice(0, 12).forEach((game: SteamGame) => {
          fetchGameImage(game.appid);
        });
      } catch (err) {
        console.error('Error searching games:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGameImage = async (appid: number) => {
    if (gameImages[appid]) return;
    
    // Use Steam's CDN image URL format
    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
    setGameImages(prev => ({ ...prev, [appid]: imageUrl }));
  };

  const handleSubmit = async () => {
    if (!selectedGame) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steam_app_id: selectedGame.appid,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit game');
      }

      // Success
      setSearchQuery('');
      setSelectedGame(null);
      setSearchResults([]);
      setShowResults(false);
      setError('');
      onGameSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectGame = (game: SteamGame) => {
    setSelectedGame(game);
    setSearchQuery(game.name);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGame(null);
    setSearchResults([]);
    setShowResults(false);
    setError('');
  };

  if (!session) {
    return (
      <div className="text-center py-8 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
        <div className="text-5xl mb-3">🔒</div>
        <p className="text-gray-400 text-lg font-medium mb-2">
          Logg inn for å foreslå spill
        </p>
        <p className="text-gray-500 text-sm">
          Du må være logget inn med Twitch for å foreslå spill
        </p>
      </div>
    );
  }

  return (
    <div ref={searchContainerRef} className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-purple-500/30 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎮</span>
          <h2 className="text-2xl font-bold text-white">Søk og foreslå spill</h2>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none">
              🔍
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedGame(null);
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder="Søk etter Steam-spill (f.eks. Resident Evil, Outlast, Silent Hill)..."
              className="w-full pl-14 pr-24 py-4 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-500 border-2 border-gray-700  text-lg placeholder-gray-500 transition-all"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <div className="animate-spin text-2xl">⏳</div>
              )}
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
                  title="Tøm søk"
                >
                  ✕
                </button>
              )}
            </div>
          </div>


          {/* Search Results - Grid View */}
          {showResults && searchResults.length > 0 && !selectedGame && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">
                  Fant <span className="text-purple-400 font-bold">{searchResults.length}</span> spill
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {searchResults.map((game) => {
                  const isAlreadySuggested = suggestedGames.includes(game.appid);
                  const imageUrl = gameImages[game.appid];
                  
                  return (
                    <button
                      key={game.appid}
                      onClick={() => handleSelectGame(game)}
                      disabled={isAlreadySuggested}
                      className={`group relative bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border text-left ${
                        isAlreadySuggested 
                          ? 'border-green-600 opacity-60 cursor-not-allowed' 
                          : 'border-gray-700 hover:border-purple-500 hover:scale-[1.02]'
                      }`}
                    >
                      {/* Already Suggested Badge */}
                      {isAlreadySuggested && (
                        <div className="absolute top-2 right-2 z-10 bg-green-600 px-2 py-1 rounded-md shadow-lg">
                          <span className="text-white font-bold text-xs">✓ Foreslått</span>
                        </div>
                      )}

                      {/* Image */}
                      <div className="relative h-24 w-full bg-gradient-to-br from-purple-900 to-gray-900">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={game.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🎮
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                      </div>

                      {/* Content */}
                      <div className="p-2">
                        <h3 className={`text-xs font-bold text-white line-clamp-2 ${
                          !isAlreadySuggested && 'group-hover:text-purple-300'
                        } transition-colors`}>
                          {game.name}
                        </h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* No Results */}
          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !selectedGame && (
            <div className="text-center py-6 bg-gray-900/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-2">😕</div>
              <p className="text-gray-400 font-medium mb-1">
                Ingen spill funnet
              </p>
              <p className="text-gray-500 text-sm">
                Prøv et annet søkeord
              </p>
            </div>
          )}

          {/* Selected Game Preview */}
          {selectedGame && (
            <div className="animate-slide-up">
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-3 border border-green-500/50 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-green-400 font-bold text-sm">Spill valgt!</p>
                    <p className="text-gray-400 text-xs">Klar til å sende inn</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-purple-500/50 shadow-lg">
                <div className="relative h-48 w-full bg-black group">
                  {gameImages[selectedGame.appid] ? (
                    <Image
                      src={gameImages[selectedGame.appid]}
                      alt={selectedGame.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎮
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎮</span>
                    {selectedGame.name}
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <p className="text-gray-400 text-sm">
                      Steam ID: <span className="text-purple-400 font-mono">{selectedGame.appid}</span>
                    </p>
                    <a
                      href={`https://store.steampowered.com/app/${selectedGame.appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                    >
                      <span>🔗</span>
                      <span>Steam Store</span>
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedGame(null);
                        setSearchQuery('');
                      }}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                      Velg annet spill
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="inline-block animate-spin mr-1">⏳</span>
                          Sender...
                        </>
                      ) : (
                        <>
                          <span className="mr-1">🎃</span>
                          Send inn forslag
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 rounded-xl p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

