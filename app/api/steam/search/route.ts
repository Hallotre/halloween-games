import { NextRequest, NextResponse } from 'next/server';
import { searchSteamGames } from '@/lib/steam';
import { sanitizeText, checkRateLimit } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Rate limiting: 20 searches per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = checkRateLimit(`steam-search-${ip}`, 20, 60000);
    
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

    // Sanitize search query
    const sanitizedQuery = sanitizeText(query, 100);

    const results = await searchSteamGames(sanitizedQuery);
    return NextResponse.json(results);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error searching Steam games:', error);
    } else {
      console.error('Error searching Steam games');
    }
    return NextResponse.json({ error: 'Kunne ikke søke etter spill' }, { status: 500 });
  }
}

