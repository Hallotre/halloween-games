import { NextRequest, NextResponse } from 'next/server';
import { getSteamGameDetails } from '@/lib/steam';
import { isValidSteamAppId, checkRateLimit } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appIds } = body;

    if (!Array.isArray(appIds) || appIds.length === 0) {
      return NextResponse.json({ error: 'Invalid appIds array' }, { status: 400 });
    }

    if (appIds.length > 20) {
      return NextResponse.json({ error: 'Too many appIds (max 20)' }, { status: 400 });
    }

    // Rate limiting: 5 batch requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = checkRateLimit(`steam-batch-${ip}`, 5, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many batch requests. Please try again later.',
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

    // Validate all app IDs
    const validAppIds = appIds.filter(id => isValidSteamAppId(parseInt(id)));
    if (validAppIds.length === 0) {
      return NextResponse.json({ error: 'No valid Steam App IDs provided' }, { status: 400 });
    }

    // Fetch details for all games with a small delay between requests to avoid overwhelming Steam
    const results: { [key: string]: any } = {};
    
    for (let i = 0; i < validAppIds.length; i++) {
      const appId = parseInt(validAppIds[i]);
      
      try {
        const gameDetails = await getSteamGameDetails(appId);
        if (gameDetails) {
          results[appId.toString()] = gameDetails;
        }
        
        // Small delay between requests to be nice to Steam's API
        if (i < validAppIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error fetching details for appId ${appId}:`, error);
        // Continue with other games even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      results,
      requested: validAppIds.length,
      found: Object.keys(results).length
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in batch Steam details:', error);
    } else {
      console.error('Error in batch Steam details');
    }
    return NextResponse.json({ error: 'Failed to fetch batch game details' }, { status: 500 });
  }
}
