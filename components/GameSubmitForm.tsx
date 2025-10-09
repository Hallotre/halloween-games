'use client';

import { SteamGame } from '@/lib/steam';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

interface GameSubmitFormProps {
  onGameSubmitted: () => void;
}

export default function GameSubmitForm({ onGameSubmitted }: GameSubmitFormProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SteamGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/steam/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data);
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
      setIsOpen(false);
      setSearchQuery('');
      setSelectedGame(null);
      setSearchResults([]);
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
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
      >
        + Suggest a Spooky Game
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Suggest a Game</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                  setSelectedGame(null);
                  setSearchResults([]);
                  setError('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedGame(null);
                  }}
                  placeholder="Search for a Steam game..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-3 text-gray-400">
                    Searching...
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((game) => (
                    <button
                      key={game.appid}
                      onClick={() => handleSelectGame(game)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 transition-colors text-white border-b border-gray-600 last:border-b-0"
                    >
                      {game.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedGame && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-white">
                    <span className="text-gray-400">Selected:</span>{' '}
                    <span className="font-bold">{selectedGame.name}</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-3 text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                    setSelectedGame(null);
                    setSearchResults([]);
                    setError('');
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedGame || isSubmitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Game'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

