'use client';

import { SteamGame } from '@/lib/steam';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { trackSearch, trackGameSubmission } from '@/lib/tracking-client';

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
  const [gameImages, setGameImages] = useState<{ [key: number]: string | null }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: number }>({});
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
        
        // Track search event
        trackSearch(searchQuery, data.length, (session?.user as any)?.id);
        
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
    if (gameImages[appid] !== undefined) return;
    
    setImageLoading(prev => ({ ...prev, [appid]: true }));
    
    // Try multiple Steam CDN URLs in order of preference
    const imageUrls = [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/header.jpg`,
      `https://cdn.steamstatic.com/steam/apps/${appid}/header.jpg`
    ];
    
    // Start with the first URL
    setGameImages(prev => ({ ...prev, [appid]: imageUrls[0] }));
    setImageLoading(prev => ({ ...prev, [appid]: false }));
  };

  const handleImageError = (appid: number) => {
    const errorCount = imageErrors[appid] || 0;
    const imageUrls = [
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
      `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/header.jpg`,
      `https://cdn.steamstatic.com/steam/apps/${appid}/header.jpg`
    ];
    
    if (errorCount < imageUrls.length - 1) {
      // Try next URL
      const nextUrl = imageUrls[errorCount + 1];
      setGameImages(prev => ({ ...prev, [appid]: nextUrl }));
      setImageErrors(prev => ({ ...prev, [appid]: errorCount + 1 }));
    } else {
      // All URLs failed, set to null
      setGameImages(prev => ({ ...prev, [appid]: null }));
    }
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

      // Success - track event
      trackGameSubmission(selectedGame.appid.toString(), selectedGame.name, (session?.user as any)?.id);
      
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
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/40 shadow-xl">
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
              className="w-full pl-14 pr-24 py-4 bg-gray-900 text-white rounded-xl focus:outline-none text-lg placeholder-gray-500 transition-all"
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
                      className={`group relative bg-gray-900 rounded-lg overflow-hidden shadow-md transition-all duration-300 border text-left ${
                        isAlreadySuggested 
                          ? 'border-green-600/60 opacity-60 cursor-not-allowed' 
                          : 'border-gray-700/50 hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                      }`}
                    >
                      {/* Already Suggested Badge */}
                      {isAlreadySuggested && (
                        <div className="absolute top-2 right-2 z-10 bg-green-600 px-2 py-1 rounded-md shadow-lg">
                          <span className="text-white font-bold text-xs">✓ Foreslått</span>
                        </div>
                      )}

                      {/* Image */}
                      <div className="relative h-24 w-full bg-gradient-to-br from-purple-900 to-gray-900 overflow-hidden">
                        {imageLoading[game.appid] ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                          </div>
                        ) : imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={game.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                            unoptimized
                            onError={() => handleImageError(game.appid)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                            🎮
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent group-hover:from-purple-900/40 transition-colors duration-300"></div>
                      </div>

                      {/* Content */}
                      <div className="p-2 bg-gray-900 group-hover:bg-gray-900/80 transition-colors duration-300">
                        <h3 className={`text-xs font-bold text-white line-clamp-2 ${
                          !isAlreadySuggested && 'group-hover:text-purple-300'
                        } transition-colors duration-300`}>
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
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-3 border border-green-600/30 mb-3">
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
              
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg">
                <div className="relative h-48 w-full bg-black group">
                  {imageLoading[selectedGame.appid] ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    </div>
                  ) : gameImages[selectedGame.appid] ? (
                    <Image
                      src={gameImages[selectedGame.appid]!}
                      alt={selectedGame.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => handleImageError(selectedGame.appid)}
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
                          <span className="inline-block w-5 h-5 flex-shrink-0 mr-1">
                            <Image src="/media/img/skibenDOC.webp" alt="Submit" width={20} height={20} className="w-full h-full rounded-full object-cover" />
                          </span>
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
            <div className="bg-red-600/20 border border-red-600/50 rounded-xl p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

