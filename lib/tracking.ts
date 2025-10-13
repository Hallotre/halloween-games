// User tracking and analytics system
import { supabaseServer } from './supabase-server';

export interface TrackingEvent {
  id?: string;
  user_id?: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, any>;
  page_url: string;
  user_agent?: string;
  ip_address?: string;
  created_at?: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalEvents: number;
  topGames: Array<{ game_name: string; vote_count: number; view_count: number }>;
  recentActivity: TrackingEvent[];
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionDuration: number;
  };
  popularSearches: Array<{ query: string; count: number }>;
}

// Sanitize event data to prevent XSS and injection attacks
function sanitizeEventData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Only allow alphanumeric keys with underscores
    if (!/^[a-zA-Z0-9_]+$/.test(key) || key.length > 50) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = value
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
        .substring(0, 500); // Limit length
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Allow numbers and booleans as-is
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Validate session ID format
function validateSessionId(sessionId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(sessionId) && sessionId.length >= 10 && sessionId.length <= 100;
}

// Validate event type
function validateEventType(eventType: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(eventType) && eventType.length > 0 && eventType.length < 50;
}

// Rate limiting: track events per session
const sessionEventCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_EVENTS_PER_HOUR = 100;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const sessionData = sessionEventCounts.get(sessionId);
  
  if (!sessionData || now > sessionData.resetTime) {
    sessionEventCounts.set(sessionId, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (sessionData.count >= MAX_EVENTS_PER_HOUR) {
    return false;
  }
  
  sessionData.count++;
  return true;
}

// Track a user event with enhanced security
export async function trackEvent(
  sessionId: string,
  eventType: string,
  eventData: Record<string, any> = {},
  userId?: string,
  pageUrl?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Validate inputs
    if (!validateSessionId(sessionId)) {
      return { success: false, error: 'Invalid session ID' };
    }
    
    if (!validateEventType(eventType)) {
      return { success: false, error: 'Invalid event type' };
    }
    
    // Check rate limiting
    if (!checkRateLimit(sessionId)) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    
    // Sanitize inputs
    const sanitizedEventData = sanitizeEventData(eventData);
    const sanitizedPageUrl = pageUrl ? pageUrl.replace(/[<>"'&]/g, '').substring(0, 2000) : undefined;
    const sanitizedUserAgent = userAgent ? userAgent.replace(/[<>"'&]/g, '').substring(0, 1000) : undefined;
    
    // Validate event data size
    if (JSON.stringify(sanitizedEventData).length > 10000) {
      return { success: false, error: 'Event data too large' };
    }

    const event: Omit<TrackingEvent, 'id' | 'created_at'> = {
      session_id: sessionId,
      user_id: userId,
      event_type: eventType,
      event_data: sanitizedEventData,
      page_url: sanitizedPageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      user_agent: sanitizedUserAgent || (typeof window !== 'undefined' ? navigator.userAgent : ''),
    };

    const { error } = await supabaseServer
      .from('tracking_events')
      .insert(event);

    if (error) {
      console.error('Error tracking event:', error);
      return { success: false, error: 'Failed to track event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in trackEvent:', error);
    return { success: false, error: 'Internal error' };
  }
}

// Get analytics data for admins
export async function getAnalyticsData(
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const dateFilter = startDate && endDate 
      ? `created_at >= '${startDate}' AND created_at <= '${endDate}'`
      : '';

    // Get total users
    const { count: totalUsers } = await supabaseServer
      .from('tracking_events')
      .select('user_id', { count: 'exact', head: true })
      .not('user_id', 'is', null);

    // Get total sessions
    const { count: totalSessions } = await supabaseServer
      .from('tracking_events')
      .select('session_id', { count: 'exact', head: true });

    // Get total events
    const { count: totalEvents } = await supabaseServer
      .from('tracking_events')
      .select('*', { count: 'exact', head: true });

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
      .not('event_data->query', 'is', null);

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

    const analyticsData: AnalyticsData = {
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalEvents: totalEvents || 0,
      topGames: topGames?.map((game: any) => ({
        game_name: game.game_name,
        vote_count: game.vote_count || 0,
        view_count: 0 // Could be calculated from view events
      })) || [],
      recentActivity: recentActivity || [],
      userEngagement: {
        dailyActiveUsers: dailyActiveUsers || 0,
        weeklyActiveUsers: weeklyActiveUsers || 0,
        averageSessionDuration: 0, // Could be calculated from session data
      },
      popularSearches,
    };

    return { success: true, data: analyticsData };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return { success: false, error: 'Failed to get analytics data' };
  }
}

// Generate a unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID from localStorage
export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

// Track page view
export async function trackPageView(
  pageName: string,
  userId?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'page_view',
    {
      page_name: pageName,
      ...additionalData,
    },
    userId
  );
}

// Track user vote
export async function trackVote(
  gameId: string,
  gameName: string,
  action: 'vote' | 'unvote',
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'vote',
    {
      game_id: gameId,
      game_name: gameName,
      action,
    },
    userId
  );
}

// Track search
export async function trackSearch(
  query: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'search',
    {
      query,
      results_count: resultsCount,
    },
    userId
  );
}

// Track game submission
export async function trackGameSubmission(
  gameId: string,
  gameName: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'game_submission',
    {
      game_id: gameId,
      game_name: gameName,
    },
    userId
  );
}

// Track tab switch
export async function trackTabSwitch(
  tabName: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'tab_switch',
    {
      tab_name: tabName,
    },
    userId
  );
}

// Track sorting change
export async function trackSortingChange(
  sortBy: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  await trackEvent(
    sessionId,
    'sorting_change',
    {
      sort_by: sortBy,
    },
    userId
  );
}
