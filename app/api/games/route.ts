import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { getSteamGameDetails } from '@/lib/steam';
import { isValidSteamAppId, isValidUUID, sanitizeText, checkRateLimit } from '@/lib/validation';
import { isAdmin } from '@/lib/admin';
import { trackEvent as trackServerEvent } from '@/lib/tracking';

export async function GET() {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase client not initialized');
      }
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Fetch games with vote counts
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        votes(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching games:', error);
      } else {
        console.error('Error fetching games');
      }
      return NextResponse.json({ error: 'Kunne ikke hente spill' }, { status: 500 });
    }

    // Transform the data to include vote_count
    const gamesWithVotes = games?.map((game: any) => ({
      ...game,
      vote_count: game.votes?.[0]?.count || 0,
      votes: undefined, // Remove the nested votes object
    }));

    return NextResponse.json(gamesWithVotes || []);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in GET /api/games:', error);
    } else {
      console.error('Error in GET /api/games');
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

    // Rate limiting: 5 game submissions per minute per user
    const userId = (session.user as any).id;
    const rateLimitResult = checkRateLimit(`game-submit-${userId}`, 5, 60000);
    
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
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await request.json();
    const { steam_app_id } = body;

    // Validate Steam App ID
    if (!isValidSteamAppId(steam_app_id)) {
      return NextResponse.json({ error: 'Ugyldig steam_app_id' }, { status: 400 });
    }

    // Validate game exists on Steam
    const gameDetails = await getSteamGameDetails(steam_app_id);

    if (!gameDetails) {
      return NextResponse.json({ error: 'Spill ikke funnet på Steam' }, { status: 404 });
    }

    // Check if game already exists
    const { data: existingGame } = await supabaseServer
      .from('games')
      .select('*')
      .eq('steam_app_id', steam_app_id)
      .single();

    if (existingGame) {
      return NextResponse.json({ error: 'Spill allerede foreslått' }, { status: 409 });
    }

    // Sanitize username
    const username = sanitizeText((session.user as any).username || session.user.name || 'Anonymous', 50);

    // Insert new game using server client (has elevated permissions)
    const { data: newGame, error } = await supabaseServer
      .from('games')
      .insert({
        steam_app_id: gameDetails.appid,
        game_name: sanitizeText(gameDetails.name, 200),
        game_image: gameDetails.header_image, // Already validated by Steam
        suggested_by: username,
        is_played: false,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error inserting game:', error);
      } else {
        console.error('Error inserting game');
      }
      return NextResponse.json({ error: 'Kunne ikke legge til spill' }, { status: 500 });
    }

    return NextResponse.json(newGame, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in POST /api/games:', error);
    } else {
      console.error('Error in POST /api/games');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if Supabase is initialized
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    // Check if user is an admin
    const userId = (session.user as any).id;
    const userIsAdmin = await isAdmin(userId);

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbudt' }, { status: 403 });
    }

    const body = await request.json();
    const { game_id, is_played } = body;

    // Validate UUID format
    if (!game_id || !isValidUUID(game_id)) {
      return NextResponse.json({ error: 'Ugyldig game_id format' }, { status: 400 });
    }

    if (typeof is_played !== 'boolean') {
      return NextResponse.json({ error: 'Ugyldig is_played verdi' }, { status: 400 });
    }

    // Use server client for privileged operation
    const { data, error } = await supabaseServer
      .from('games')
      .update({ is_played })
      .eq('id', game_id)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating game:', error);
      } else {
        console.error('Error updating game');
      }
      return NextResponse.json({ error: 'Kunne ikke oppdatere spill' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in PATCH /api/games:', error);
    } else {
      console.error('Error in PATCH /api/games');
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

    // Check if user is an admin
    const userId = (session.user as any).id;
    const userIsAdmin = await isAdmin(userId);

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbudt' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    // Validate UUID format
    if (!game_id || !isValidUUID(game_id)) {
      return NextResponse.json({ error: 'Ugyldig game_id format' }, { status: 400 });
    }

		// Fetch game details before deletion for logging
		const { data: gameBeforeDelete } = await supabaseServer
			.from('games')
			.select('id, game_name, steam_app_id')
			.eq('id', game_id)
			.single();

		// Delete associated votes first (cascade should handle this, but being explicit)
    // Use server client for privileged operation
    await supabaseServer.from('votes').delete().eq('game_id', game_id);

    // Delete the game
		const { error } = await supabaseServer
      .from('games')
      .delete()
      .eq('id', game_id);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting game:', error);
      } else {
        console.error('Error deleting game');
      }

			// Track failed admin delete
			const sessionId = `session_admin_${userId}_${Date.now()}`;
			await trackServerEvent(sessionId, 'admin_delete_game', {
				outcome: 'error',
				game_id,
				game_name: gameBeforeDelete?.game_name,
				steam_app_id: gameBeforeDelete?.steam_app_id,
				admin_username: (session.user as any)?.username || session.user?.name,
				error: typeof error === 'object' && error !== null ? String((error as any).message || error) : String(error),
			}, userId);
      return NextResponse.json({ error: 'Kunne ikke slette spill' }, { status: 500 });
    }

		// Track successful admin delete
		const sessionId = `session_admin_${userId}_${Date.now()}`;
		await trackServerEvent(sessionId, 'admin_delete_game', {
			outcome: 'success',
			game_id,
			game_name: gameBeforeDelete?.game_name,
			steam_app_id: gameBeforeDelete?.steam_app_id,
			admin_username: (session.user as any)?.username || session.user?.name,
		}, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in DELETE /api/games:', error);
    } else {
      console.error('Error in DELETE /api/games');
    }

		// Best-effort tracking of unexpected error
		try {
			const session = await getServerSession(authOptions);
			const userId = (session?.user as any)?.id;
			const { searchParams } = new URL(request.url);
			const game_id = searchParams.get('game_id');
			const sessionId = `session_admin_${userId || 'unknown'}_${Date.now()}`;
			await trackServerEvent(sessionId, 'admin_delete_game', {
				outcome: 'exception',
				game_id,
				admin_username: (session?.user as any)?.username || session?.user?.name,
				error: typeof error === 'object' && error !== null ? String((error as any).message || error) : String(error),
			}, userId);
		} catch (_) {
			// ignore secondary tracking failures
		}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

