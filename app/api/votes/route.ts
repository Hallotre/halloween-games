import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all votes for the current user
    const { data: votes, error } = await supabase
      .from('votes')
      .select('game_id')
      .eq('twitch_user_id', userId);

    if (error) {
      console.error('Error fetching votes:', error);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    return NextResponse.json(votes || []);
  } catch (error) {
    console.error('Error in GET /api/votes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { game_id } = body;

    if (!game_id) {
      return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const username = (session.user as any).username || session.user.name;

    // Check if user already voted for this game
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', game_id)
      .eq('twitch_user_id', userId)
      .single();

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted for this game' }, { status: 409 });
    }

    // Insert vote
    const { data: newVote, error } = await supabase
      .from('votes')
      .insert({
        game_id,
        twitch_user_id: userId,
        twitch_username: username,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting vote:', error);
      return NextResponse.json({ error: 'Failed to add vote' }, { status: 500 });
    }

    return NextResponse.json(newVote, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/votes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    if (!game_id) {
      return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Delete vote
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('game_id', game_id)
      .eq('twitch_user_id', userId);

    if (error) {
      console.error('Error deleting vote:', error);
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/votes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

