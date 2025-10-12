import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin, getAllAdmins, addAdmin, removeAdmin } from '@/lib/admin';
import { sanitizeText, checkRateLimit } from '@/lib/validation';

// Force dynamic route - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get all admins
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user is an admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    const admins = await getAllAdmins();
    return NextResponse.json(admins);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in GET /api/admins:', error);
    } else {
      console.error('Error in GET /api/admins');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user is an admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    // Rate limiting: 5 admin additions per minute
    const rateLimitResult = checkRateLimit(`admin-add-${userId}`, 5, 60000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'For mange forespørsler. Prøv igjen om litt.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { twitch_user_id, twitch_username } = body;

    if (!twitch_user_id || !twitch_username) {
      return NextResponse.json(
        { error: 'Mangler twitch_user_id eller twitch_username' },
        { status: 400 }
      );
    }

    // Sanitize username
    const sanitizedUsername = sanitizeText(twitch_username, 50);

    const result = await addAdmin(twitch_user_id, sanitizedUsername, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Kunne ikke legge til admin' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in POST /api/admins:', error);
    } else {
      console.error('Error in POST /api/admins');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove an admin
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user is an admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const twitch_user_id = searchParams.get('twitch_user_id');

    if (!twitch_user_id) {
      return NextResponse.json({ error: 'Mangler twitch_user_id' }, { status: 400 });
    }

    // Prevent admins from removing themselves
    if (twitch_user_id === userId) {
      return NextResponse.json(
        { error: 'Du kan ikke fjerne deg selv som admin' },
        { status: 400 }
      );
    }

    const result = await removeAdmin(twitch_user_id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Kunne ikke fjerne admin' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in DELETE /api/admins:', error);
    } else {
      console.error('Error in DELETE /api/admins');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

