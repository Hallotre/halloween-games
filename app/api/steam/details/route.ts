import { NextRequest, NextResponse } from 'next/server';
import { getSteamGameDetails } from '@/lib/steam';
import { isValidSteamAppId, checkRateLimit } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appid');

    if (!appId) {
      return NextResponse.json({ error: 'Missing appid parameter' }, { status: 400 });
    }

    const steamAppId = parseInt(appId);
    if (!isValidSteamAppId(steamAppId)) {
      return NextResponse.json({ error: 'Invalid Steam App ID' }, { status: 400 });
    }

    // Rate limiting: 30 requests per minute per IP (more generous)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = checkRateLimit(`steam-details-${ip}`, 30, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
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

    const gameDetails = await getSteamGameDetails(steamAppId);
    
    if (!gameDetails) {
      return NextResponse.json({ 
        error: 'Game not found on Steam or data unavailable',
        appId: steamAppId 
      }, { status: 404 });
    }

    return NextResponse.json(gameDetails);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching Steam game details:', error);
    } else {
      console.error('Error fetching Steam game details');
    }
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 });
  }
}
