import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { isValidUUID, sanitizeText, checkRateLimit } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all votes for the current user
    const { data: votes, error } = await supabase
      .from('votes')
      .select('game_id')
      .eq('twitch_user_id', userId);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching votes:', error);
      } else {
        console.error('Error fetching votes');
      }
      return NextResponse.json({ error: 'Kunne ikke hente stemmer' }, { status: 500 });
    }

    return NextResponse.json(votes || []);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in GET /api/votes:', error);
    } else {
      console.error('Error in GET /api/votes');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    // Rate limiting: 10 votes per minute per user
    const userId = (session.user as any).id;
    const rateLimitResult = checkRateLimit(`vote-${userId}`, 10, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'For mange forespørsler. Prøv igjen om litt.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          }
        }
      );
    }

    const body = await request.json();
    const { game_id } = body;

    // Validate UUID format
    if (!game_id || !isValidUUID(game_id)) {
      return NextResponse.json({ error: 'Ugyldig game_id format' }, { status: 400 });
    }

    const username = sanitizeText((session.user as any).username || session.user.name || 'Anonymous', 50);

    // Check if user already voted for this game
    const { data: existingVote } = await supabaseServer
      .from('votes')
      .select('*')
      .eq('game_id', game_id)
      .eq('twitch_user_id', userId)
      .single();

    if (existingVote) {
      return NextResponse.json({ error: 'Har allerede stemt på dette spillet' }, { status: 409 });
    }

    // Insert vote using server client
    const { data: newVote, error } = await supabaseServer
      .from('votes')
      .insert({
        game_id,
        twitch_user_id: userId,
        twitch_username: username,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error inserting vote:', error);
      } else {
        console.error('Error inserting vote');
      }
      return NextResponse.json({ error: 'Kunne ikke legge til stemme' }, { status: 500 });
    }

    return NextResponse.json(newVote, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in POST /api/votes:', error);
    } else {
      console.error('Error in POST /api/votes');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    // Validate UUID format
    if (!game_id || !isValidUUID(game_id)) {
      return NextResponse.json({ error: 'Ugyldig game_id format' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Delete vote using server client
    const { error } = await supabaseServer
      .from('votes')
      .delete()
      .eq('game_id', game_id)
      .eq('twitch_user_id', userId);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting vote:', error);
      } else {
        console.error('Error deleting vote');
      }
      return NextResponse.json({ error: 'Kunne ikke fjerne stemme' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in DELETE /api/votes:', error);
    } else {
      console.error('Error in DELETE /api/votes');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

