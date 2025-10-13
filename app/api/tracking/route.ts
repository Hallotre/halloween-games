import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// POST - Track an event using service role (bypasses RLS)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { sessionId, eventType, eventData, userId, pageUrl, userAgent } = body;

    // Validate required fields
    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Insert tracking event using service role (bypasses RLS)
    const { error } = await supabaseServer
      .from('tracking_events')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        event_type: eventType,
        event_data: eventData || {},
        page_url: pageUrl || null,
        user_agent: userAgent || null,
        ip_address: ipAddress,
      });

    if (error) {
      console.error('Error tracking event:', error);
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in tracking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
