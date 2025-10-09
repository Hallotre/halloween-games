import { NextRequest, NextResponse } from 'next/server';
import { searchSteamGames } from '@/lib/steam';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await searchSteamGames(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching Steam games:', error);
    return NextResponse.json({ error: 'Kunne ikke søke etter spill' }, { status: 500 });
  }
}

