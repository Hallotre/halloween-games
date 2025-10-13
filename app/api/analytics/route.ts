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
    // Authentication check for production
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Skip RPC function to use enhanced analytics
    // try {
    //   const { data, error } = await supabaseServer
    //     .rpc('get_analytics_data', {
    //       start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    //       end_date: endDate || new Date().toISOString()
    //     });

    //   if (error) {
    //     throw error;
    //   }

    //   return NextResponse.json(data);
    // } catch (rpcError) {
      // Use enhanced analytics
      console.log('🔍 Using enhanced analytics...');
      
      const startDateFilter = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      // Get total users (unique count)
      const { data: uniqueUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id')
        .not('user_id', 'is', null)
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);
      
      const totalUsers = new Set(uniqueUsers?.map((u: any) => u.user_id) || []).size;

      // Get total sessions (unique count)
      const { data: uniqueSessions } = await supabaseServer
        .from('tracking_events')
        .select('session_id')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);
      
      const totalSessions = new Set(uniqueSessions?.map((s: any) => s.session_id) || []).size;

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

      // Get enhanced event summary from secure view
      const { data: eventSummary } = await supabaseServer
        .from('event_summary')
        .select('*')
        .order('count', { ascending: false });

      // Get daily activity summary from secure view
      const { data: dailyActivity } = await supabaseServer
        .from('daily_activity_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      // Get user engagement metrics from secure view
      const { data: engagementMetrics } = await supabaseServer
        .from('user_engagement_metrics')
        .select('*');

      // Get security analytics from secure view
      const { data: securityMetrics } = await supabaseServer
        .from('security_analytics')
        .select('*');

      // Get hourly activity data
      let hourlyActivity = [];
      try {
        const { data: hourlyData } = await supabaseServer
          .from('hourly_activity_summary')
          .select('*')
          .limit(24);
        hourlyActivity = hourlyData || [];
      } catch (error) {
        // Silently handle error - hourly activity is optional
      }

      // Get enhanced analytics from working views
      let weeklyActivity = [];
      let userBehaviorMetrics = [];
      let performanceMetrics = [];
      let conversionFunnel = [];
      let topPerformingContent = [];
      let geographicAnalytics = [];
      let deviceAnalytics = [];
      let sessionAnalytics = [];

      // Load all enhanced analytics
      const { data: weeklyData } = await supabaseServer
        .from('weekly_activity_summary')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(12);
      weeklyActivity = weeklyData || [];

      const { data: behaviorData } = await supabaseServer
        .from('user_behavior_metrics')
        .select('*');
      userBehaviorMetrics = behaviorData || [];

      const { data: performanceData } = await supabaseServer
        .from('performance_metrics')
        .select('*');
      performanceMetrics = performanceData || [];

      const { data: conversionData } = await supabaseServer
        .from('conversion_funnel')
        .select('*');
      conversionFunnel = conversionData || [];

      const { data: contentData } = await supabaseServer
        .from('top_performing_content')
        .select('*')
        .limit(20);
      topPerformingContent = contentData || [];

      const { data: geoData } = await supabaseServer
        .from('geographic_analytics')
        .select('*');
      geographicAnalytics = geoData || [];

      const { data: deviceData } = await supabaseServer
        .from('device_analytics')
        .select('*');
      deviceAnalytics = deviceData || [];

      const { data: sessionData } = await supabaseServer
        .from('session_analytics')
        .select('*');
      sessionAnalytics = sessionData || [];

      // Enhanced analytics data loaded successfully

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

      // Get daily active users (unique count)
      const { data: dailyUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id')
        .not('user_id', 'is', null)
        .gte('created_at', oneDayAgo.toISOString());
      
      const dailyActiveUsers = new Set(dailyUsers?.map((u: any) => u.user_id) || []).size;

      // Get weekly active users (unique count)
      const { data: weeklyUsers } = await supabaseServer
        .from('tracking_events')
        .select('user_id')
        .not('user_id', 'is', null)
        .gte('created_at', oneWeekAgo.toISOString());
      
      const weeklyActiveUsers = new Set(weeklyUsers?.map((u: any) => u.user_id) || []).size;

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
        popularSearches,
        // Enhanced analytics from secure views
        eventSummary: eventSummary || [],
        dailyActivity: dailyActivity || [],
        engagementMetrics: engagementMetrics || [],
        securityMetrics: securityMetrics || [],
        // Enhanced analytics from working views
        hourlyActivity: hourlyActivity,
        weeklyActivity: weeklyActivity,
        userBehaviorMetrics: userBehaviorMetrics,
        performanceMetrics: performanceMetrics,
        conversionFunnel: conversionFunnel,
        topPerformingContent: topPerformingContent,
        geographicAnalytics: geographicAnalytics,
        deviceAnalytics: deviceAnalytics,
        sessionAnalytics: sessionAnalytics
      };

      return NextResponse.json(analyticsData);
    } catch (error) {
      console.error('Error in GET /api/analytics:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
