'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalEvents: number;
  topGames: Array<{ game_name: string; vote_count: number; view_count: number }>;
  recentActivity: Array<{
    id: string;
    user_id?: string;
    session_id: string;
    event_type: string;
    event_data: Record<string, any>;
    page_url: string;
    created_at: string;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionDuration: number;
  };
  popularSearches: Array<{ query: string; count: number }>;
}

interface AnalyticsDashboardProps {
  isAdmin: boolean;
}

export default function AnalyticsDashboard({ isAdmin }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      
      const response = await fetch(`/api/analytics?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-white mb-2">Ingen tilgang</h3>
        <p className="text-gray-400">Du har ikke tilgang til analytics dashboardet</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-gray-400">Laster analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Feil ved lasting</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl font-bold text-white mb-2">Ingen data tilgjengelig</h3>
        <p className="text-gray-400">Ingen analytics data funnet for den valgte perioden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📊</span>
            Analytics Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Oversikt over brukeraktivitet og engasjement</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:border-purple-500/50"
          />
          <span className="text-gray-400">til</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Oppdater
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Image src="/media/img/skibenDOC.webp" alt="Users" width={32} height={32} className="w-8 h-8 object-cover rounded-full" />
            <div className="text-2xl font-bold text-purple-400">
              {analyticsData.totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="text-gray-400 text-sm">Totale brukere</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Image src="/media/img/POGGERS.webp" alt="Sessions" width={32} height={32} className="w-8 h-8 object-cover rounded-full" />
            <div className="text-2xl font-bold text-orange-400">
              {analyticsData.totalSessions.toLocaleString()}
            </div>
          </div>
          <div className="text-gray-400 text-sm">Totale sesjoner</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <div className="text-2xl font-bold text-green-400">
              {analyticsData.totalEvents.toLocaleString()}
            </div>
          </div>
          <div className="text-gray-400 text-sm">Totale hendelser</div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👥</span>
            <div className="text-2xl font-bold text-blue-400">
              {analyticsData.userEngagement.dailyActiveUsers}
            </div>
          </div>
          <div className="text-gray-400 text-sm">Daglige aktive brukere</div>
        </div>
      </div>

      {/* Top Games */}
      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🏆</span>
          Mest populære spill
        </h3>
        <div className="space-y-3">
          {analyticsData.topGames.slice(0, 5).map((game, index) => (
            <div key={game.game_name} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎮'}
                </span>
                <span className="text-white font-medium">{game.game_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold">{game.vote_count}</span>
                <span className="text-gray-400 text-sm">stemmer</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Searches */}
      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🔍</span>
          Populære søk
        </h3>
        <div className="space-y-2">
          {analyticsData.popularSearches.slice(0, 10).map((search, index) => (
            <div key={search.query} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
              <span className="text-white">{search.query}</span>
              <span className="text-gray-400 text-sm">{search.count} søk</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📋</span>
          Nylig aktivitet
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {analyticsData.recentActivity.slice(0, 20).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {activity.event_type === 'vote' ? '🗳️' :
                   activity.event_type === 'search' ? '🔍' :
                   activity.event_type === 'page_view' ? '👁️' :
                   activity.event_type === 'game_submission' ? '➕' : '📝'}
                </span>
                <div>
                  <span className="text-white font-medium">
                    {activity.event_type.replace('_', ' ').toUpperCase()}
                  </span>
                  {activity.event_data?.game_name && (
                    <span className="text-gray-400 ml-2">- {activity.event_data.game_name}</span>
                  )}
                  {activity.event_data?.query && (
                    <span className="text-gray-400 ml-2">- "{activity.event_data.query}"</span>
                  )}
                </div>
              </div>
              <span className="text-gray-400 text-sm">
                {new Date(activity.created_at).toLocaleString('no-NO')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
