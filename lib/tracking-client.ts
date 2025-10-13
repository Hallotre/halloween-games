// Client-side tracking implementation
import { supabase } from './supabase';

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

// Track a user event (client-side) - now uses API route with service role
export async function trackEvent(
  sessionId: string,
  eventType: string,
  eventData: Record<string, any> = {},
  userId?: string,
  pageUrl?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
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

    // Use API route instead of direct Supabase call
    const response = await fetch('/api/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        eventType,
        eventData: sanitizedEventData,
        userId,
        pageUrl: sanitizedPageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        userAgent: sanitizedUserAgent || (typeof window !== 'undefined' ? navigator.userAgent : ''),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to track event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in trackEvent:', error);
    return { success: false, error: 'Internal error' };
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
  const result = await trackEvent(
    sessionId,
    'page_view',
    {
      page_name: pageName,
      ...additionalData,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track page view:', result.error);
  }
}

// Track user vote
export async function trackVote(
  gameId: string,
  gameName: string,
  action: 'vote' | 'unvote',
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  const result = await trackEvent(
    sessionId,
    'vote',
    {
      game_id: gameId,
      game_name: gameName,
      action,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track vote:', result.error);
  }
}

// Track search
export async function trackSearch(
  query: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  const result = await trackEvent(
    sessionId,
    'search',
    {
      query,
      results_count: resultsCount,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track search:', result.error);
  }
}

// Track game submission
export async function trackGameSubmission(
  gameId: string,
  gameName: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  const result = await trackEvent(
    sessionId,
    'game_submission',
    {
      game_id: gameId,
      game_name: gameName,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track game submission:', result.error);
  }
}

// Track tab switch
export async function trackTabSwitch(
  tabName: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  const result = await trackEvent(
    sessionId,
    'tab_switch',
    {
      tab_name: tabName,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track tab switch:', result.error);
  }
}

// Track sorting change
export async function trackSortingChange(
  sortBy: string,
  userId?: string
): Promise<void> {
  const sessionId = getSessionId();
  const result = await trackEvent(
    sessionId,
    'sorting_change',
    {
      sort_by: sortBy,
    },
    userId
  );
  
  if (!result.success) {
    console.warn('Failed to track sorting change:', result.error);
  }
}
