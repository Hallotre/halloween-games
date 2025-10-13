'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

interface Admin {
  id: string;
  twitch_user_id: string;
  twitch_username: string;
  added_by: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'admins' | 'analytics'>('admins');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/user/is-streamer');
        const data = await response.json();
        setIsAdmin(data.isStreamer);
        
        if (!data.isStreamer) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [session, router]);

  const fetchAdmins = async () => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/admins', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data);
      setError('');
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError('Kunne ikke laste administratorer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdmins();
    }
  }, [isAdmin]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsAdding(true);

    try {
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twitch_user_id: newAdminId,
          twitch_username: newAdminUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke legge til administrator');
      }

      setSuccess(`${newAdminUsername} har blitt lagt til som administrator!`);
      setNewAdminId('');
      setNewAdminUsername('');
      
      // Refresh admins list
      const refreshResponse = await fetch('/api/admins');
      const refreshedData = await refreshResponse.json();
      setAdmins(refreshedData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async (twitchUserId: string, username: string) => {
    if (!confirm(`Er du sikker på at du vil fjerne ${username} som administrator?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admins?twitch_user_id=${twitchUserId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke fjerne administrator');
      }

      setSuccess(`${username} har blitt fjernet som administrator`);
      
      // Refresh admins list
      const refreshResponse = await fetch('/api/admins');
      const refreshedData = await refreshResponse.json();
      setAdmins(refreshedData);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const currentUserId = (session?.user as any)?.id;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-white text-xl">Laster administrator panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-6xl">⚙️</span>
              <h1 className="text-5xl font-bold text-white">
                Administrator Panel
              </h1>
            </div>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Administrer hvem som kan slette spill og legge til nye administratorer
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400">{admins.length}</div>
                <div className="text-gray-400 text-sm">Totalt Administratorer</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur rounded-lg p-4 border border-orange-500/20">
                <div className="text-3xl font-bold text-orange-400">{(session?.user as any)?.username || session?.user?.name || 'Deg'}</div>
                <div className="text-gray-400 text-sm">Innlogget som</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800/50 backdrop-blur rounded-lg p-1 border border-gray-700/50 mb-8">
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'admins'
                ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>👥</span>
              Administratorer
            </span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              Analytics
            </span>
          </button>
        </div>

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard isAdmin={isAdmin} />
        )}

        {/* Admin Management */}
        {activeTab === 'admins' && (
          <>
            {/* Add Admin Form */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-8 border border-purple-500/30 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">➕</span>
            <h2 className="text-3xl font-bold text-white">
              Legg til Administrator
            </h2>
          </div>
          
          {error && (
            <div className="bg-red-600/20 border-2 border-red-600 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <p className="text-red-400 text-lg">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-600/20 border-2 border-green-600 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <p className="text-green-400 text-lg">{success}</p>
            </div>
          )}

          <form onSubmit={handleAddAdmin} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-white font-bold mb-3 text-lg flex items-center gap-2">
                  <span>👤</span>
                  Twitch Brukernavn
                </label>
                <input
                  id="username"
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="skribenso"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-600 text-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="userid" className="block text-white font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🔢</span>
                  Twitch User ID
                </label>
                <input
                  id="userid"
                  type="text"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 border border-gray-600 text-lg"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <span className="text-xl">💡</span>
                <span>
                  Finn Twitch User ID på{' '}
                  <a
                    href="https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    streamweasels.com
                  </a>
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isAdding || !newAdminId || !newAdminUsername}
              className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-orange-600"
            >
              {isAdding ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Legger til administrator...
                </>
              ) : (
                <>
                  <span className="mr-2">➕</span>
                  Legg til Administrator
                </>
              )}
            </button>
          </form>
        </div>

        {/* Admins List */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👥</span>
              <h2 className="text-3xl font-bold text-white">
                Nåværende Administratorer
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchAdmins();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Oppdater liste"
              >
                <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                <span className="hidden sm:inline">Oppdater</span>
              </button>
              <div className="bg-purple-600/30 px-4 py-2 rounded-full border border-purple-500/50">
                <span className="text-white font-bold text-xl">{admins.length}</span>
              </div>
            </div>
          </div>

          {admins.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-gray-400 text-xl">Ingen administratorer funnet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {admins.map((admin, index) => (
                <div
                  key={admin.id}
                  className={`bg-gray-700/50 hover:bg-gray-700 rounded-xl p-6 flex items-center justify-between border transition-all ${
                    admin.twitch_user_id === currentUserId
                      ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                      : 'border-gray-600 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {index === 0 ? '👑' : admin.twitch_username[0].toUpperCase()}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-xl">
                          {admin.twitch_username}
                        </h3>
                        {admin.twitch_user_id === currentUserId && (
                          <span className="text-xs bg-purple-600 px-3 py-1 rounded-full font-bold">
                            DEG
                          </span>
                        )}
                        {index === 0 && (
                          <span className="text-xs bg-yellow-600 px-3 py-1 rounded-full font-bold">
                            HOVEDADMIN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <p className="text-gray-400">
                          <span className="text-gray-500">ID:</span> {admin.twitch_user_id}
                        </p>
                        <p className="text-gray-500">
                          <span className="text-gray-600">•</span> Lagt til: {new Date(admin.created_at).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {admin.twitch_user_id !== currentUserId && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.twitch_user_id, admin.twitch_username)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      <span>Fjern</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>Tilbake til hovedsiden</span>
          </button>
        </div>
      </div>
    </main>
  );
}

