'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GamePerformance {
  id: string;
  game_name: string;
  steam_app_id: number;
  vote_count: number;
  is_played: boolean;
  game_added_date: string;
  actual_votes: number;
  unique_voters: number;
  last_vote_date: string;
  avg_hours_to_first_vote: number;
  total_views: number;
  page_views: number;
  vote_events: number;
  search_mentions: number;
}

interface UserVotingPattern {
  twitch_user_id: string;
  twitch_username: string;
  total_votes: number;
  unique_games_voted: number;
  first_vote_date: string;
  last_vote_date: string;
  voting_session_hours: number;
  total_events: number;
  page_views: number;
  searches: number;
  game_submissions: number;
}

interface RealTimeActivity {
  id: string;
  event_type: string;
  event_data: any;
  page_url: string;
  created_at: string;
  user_id: string;
  session_id: string;
  content_name: string;
  user_type: string;
}

interface GameDiscovery {
  game_name: string;
  vote_count: number;
  search_mentions: number;
  page_views: number;
  vote_events: number;
  conversion_rate_percent: number;
}

interface SessionJourney {
  session_id: string;
  user_type: string;
  total_events: number;
  session_duration_minutes: number;
  page_views: number;
  votes: number;
  searches: number;
  submissions: number;
  user_behavior_type: string;
  event_sequence: string[];
}

interface HalloweenLeaderboard {
  rank: number;
  game_name: string;
  steam_app_id: number;
  vote_count: number;
  is_played: boolean;
  actual_votes: number;
  unique_voters: number;
  vote_conversion_rate: number;
  last_vote_date: string;
  status: string;
}

interface TimePattern {
  hour_of_day: number;
  day_of_week: number;
  day_name: string;
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  votes: number;
  searches: number;
  page_views: number;
  avg_events_per_hour: number;
}

interface EnhancedDashboardData {
  gamePerformance: GamePerformance[];
  userVotingPatterns: UserVotingPattern[];
  realTimeActivity: RealTimeActivity[];
  gameDiscovery: GameDiscovery[];
  sessionJourneys: SessionJourney[];
  halloweenLeaderboard: HalloweenLeaderboard[];
  timePatterns: TimePattern[];
}

export default function EnhancedHalloweenDashboard() {
  const [data, setData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnhancedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/enhanced-dashboard');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch enhanced dashboard data');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnhancedData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-gray-400">Loading enhanced Halloween dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchEnhancedData}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400">Enhanced dashboard data could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>🎃</span>
            Halloween Games Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Advanced analytics for your spooky game voting site</p>
        </div>
        <button
          onClick={fetchEnhancedData}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Halloween Games Leaderboard */}
      {data.halloweenLeaderboard && data.halloweenLeaderboard.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span>
            Halloween Games Leaderboard
          </h3>
          <div className="space-y-3">
            {data.halloweenLeaderboard.map((game) => (
              <div key={game.game_name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-purple-400 w-8">
                    #{game.rank}
                  </div>
                  <div>
                    <div className="text-white font-medium text-lg">{game.game_name}</div>
                    <div className="text-sm text-gray-400">
                      {game.actual_votes} votes from {game.unique_voters} users
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-400">{game.vote_count}</div>
                    <div className="text-sm text-gray-400">total votes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {game.vote_conversion_rate || 0}%
                    </div>
                    <div className="text-sm text-gray-400">conversion</div>
                  </div>
                  <div className="text-2xl">
                    {game.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Performance Analytics */}
      {data.gamePerformance && data.gamePerformance.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            Game Performance Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.gamePerformance.map((game) => (
              <div key={game.id} className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-lg font-semibold text-white mb-2">{game.game_name}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Votes:</span>
                    <span className="text-orange-400 font-bold">{game.vote_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Page Views:</span>
                    <span className="text-blue-400">{game.page_views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Search Mentions:</span>
                    <span className="text-green-400">{game.search_mentions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={game.is_played ? 'text-green-400' : 'text-yellow-400'}>
                      {game.is_played ? '✅ Played' : '⏳ Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Voting Patterns */}
      {data.userVotingPatterns && data.userVotingPatterns.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>👥</span>
            User Voting Patterns
          </h3>
          <div className="space-y-3">
            {data.userVotingPatterns.map((user) => (
              <div key={user.twitch_user_id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.twitch_username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.twitch_username}</div>
                    <div className="text-sm text-gray-400">
                      {user.unique_games_voted} games voted on
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-orange-400 font-bold">{user.total_votes}</div>
                    <div className="text-gray-400">votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">{user.page_views || 0}</div>
                    <div className="text-gray-400">views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{user.searches || 0}</div>
                    <div className="text-gray-400">searches</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Activity Feed */}
      {data.realTimeActivity && data.realTimeActivity.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span>
            Real-time Activity Feed (Last 24h)
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.realTimeActivity.slice(0, 20).map((activity) => (
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
                    {activity.content_name && (
                      <span className="text-gray-400 ml-2">- {activity.content_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.user_type === 'Authenticated User' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {activity.user_type}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {new Date(activity.created_at).toLocaleString('no-NO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Discovery Analytics */}
      {data.gameDiscovery && data.gameDiscovery.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🔍</span>
            Game Discovery Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.gameDiscovery.map((game) => (
              <div key={game.game_name} className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-lg font-semibold text-white mb-3">{game.game_name}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-orange-400 font-bold text-xl">{game.vote_count}</div>
                    <div className="text-gray-400">Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-xl">{game.page_views || 0}</div>
                    <div className="text-gray-400">Page Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">{game.search_mentions || 0}</div>
                    <div className="text-gray-400">Search Mentions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-bold text-xl">{game.conversion_rate_percent || 0}%</div>
                    <div className="text-gray-400">Conversion Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Journey Analytics */}
      {data.sessionJourneys && data.sessionJourneys.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🛤️</span>
            User Session Journeys (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {data.sessionJourneys.slice(0, 10).map((session) => (
              <div key={session.session_id} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      session.user_type === 'Authenticated' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-white font-medium">
                      {session.user_type} Session
                    </span>
                    <span className="text-gray-400 text-sm">
                      {session.session_duration_minutes || 0} min
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    session.user_behavior_type === 'Engaged Voter' ? 'bg-green-600' :
                    session.user_behavior_type === 'Voter Only' ? 'bg-blue-600' :
                    session.user_behavior_type === 'Browser Only' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  } text-white`}>
                    {session.user_behavior_type}
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">{session.page_views || 0}</div>
                    <div className="text-gray-400">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-400 font-bold">{session.votes || 0}</div>
                    <div className="text-gray-400">Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{session.searches || 0}</div>
                    <div className="text-gray-400">Searches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-bold">{session.total_events || 0}</div>
                    <div className="text-gray-400">Total Events</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
