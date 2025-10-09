import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { getSteamGameDetails } from '@/lib/steam';

export async function GET() {
  try {
    // Fetch games with vote counts
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        votes(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    // Transform the data to include vote_count
    const gamesWithVotes = games?.map(game => ({
      ...game,
      vote_count: game.votes?.[0]?.count || 0,
      votes: undefined, // Remove the nested votes object
    }));

    return NextResponse.json(gamesWithVotes || []);
  } catch (error) {
    console.error('Error in GET /api/games:', error);
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
    const { steam_app_id } = body;

    if (!steam_app_id || typeof steam_app_id !== 'number') {
      return NextResponse.json({ error: 'Invalid steam_app_id' }, { status: 400 });
    }

    // Validate game exists on Steam
    const gameDetails = await getSteamGameDetails(steam_app_id);

    if (!gameDetails) {
      return NextResponse.json({ error: 'Game not found on Steam' }, { status: 404 });
    }

    // Check if game already exists
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('steam_app_id', steam_app_id)
      .single();

    if (existingGame) {
      return NextResponse.json({ error: 'Game already suggested' }, { status: 409 });
    }

    // Insert new game
    const { data: newGame, error } = await supabase
      .from('games')
      .insert({
        steam_app_id: gameDetails.appid,
        game_name: gameDetails.name,
        game_image: gameDetails.header_image,
        suggested_by: (session.user as any).username || session.user.name,
        is_played: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting game:', error);
      return NextResponse.json({ error: 'Failed to add game' }, { status: 500 });
    }

    return NextResponse.json(newGame, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the streamer
    const userId = (session.user as any).id;
    const streamerId = process.env.STREAMER_TWITCH_ID;

    if (userId !== streamerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { game_id, is_played } = body;

    if (!game_id || typeof is_played !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('games')
      .update({ is_played })
      .eq('id', game_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the streamer
    const userId = (session.user as any).id;
    const streamerId = process.env.STREAMER_TWITCH_ID;

    if (userId !== streamerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    if (!game_id) {
      return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });
    }

    // Delete associated votes first (cascade should handle this, but being explicit)
    await supabase.from('votes').delete().eq('game_id', game_id);

    // Delete the game
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', game_id);

    if (error) {
      console.error('Error deleting game:', error);
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

