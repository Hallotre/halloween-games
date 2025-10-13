import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabaseServer } from '@/lib/supabase-server';

// Force dynamic route - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user is an admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Fallback to direct queries if secure function doesn't exist yet
    try {
      const { data, error } = await supabaseServer
        .rpc('get_analytics_data', {
          start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: endDate || new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      return NextResponse.json(data);
    } catch (rpcError) {
      // Fallback to direct queries
      
      const startDateFilter = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      // Get total users
      const { count: totalUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null)
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      // Get total sessions
      const { count: totalSessions } = await supabaseServer
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      // Get total events
      const { count: totalEvents } = await supabaseServer
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      // Get top games with vote counts
      const { data: topGames } = await supabaseServer
        .from('games')
        .select('game_name, vote_count')
        .order('vote_count', { ascending: false })
        .limit(10);

      // Get recent activity
      const { data: recentActivity } = await supabaseServer
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get popular searches
      const { data: searchEvents } = await supabaseServer
        .from('tracking_events')
        .select('event_data')
        .eq('event_type', 'search')
        .not('event_data->query', 'is', null)
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      const searchCounts: Record<string, number> = {};
      searchEvents?.forEach((event: any) => {
        const query = event.event_data?.query;
        if (query) {
          searchCounts[query] = (searchCounts[query] || 0) + 1;
        }
      });

      const popularSearches = Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate user engagement metrics
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: dailyActiveUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null)
        .gte('created_at', oneDayAgo.toISOString());

      const { count: weeklyActiveUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null)
        .gte('created_at', oneWeekAgo.toISOString());

      const analyticsData = {
        totalUsers: totalUsers || 0,
        totalSessions: totalSessions || 0,
        totalEvents: totalEvents || 0,
        topGames: topGames?.map((game: any) => ({
          game_name: game.game_name,
          vote_count: game.vote_count || 0,
          view_count: 0
        })) || [],
        recentActivity: recentActivity || [],
        userEngagement: {
          dailyActiveUsers: dailyActiveUsers || 0,
          weeklyActiveUsers: weeklyActiveUsers || 0,
          averageSessionDuration: 0
        },
        popularSearches
      };

      return NextResponse.json(analyticsData);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in GET /api/analytics:', error);
    } else {
      console.error('Error in GET /api/analytics');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
