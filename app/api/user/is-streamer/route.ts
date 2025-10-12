import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ isStreamer: false });
    }

    const userId = (session.user as any).id;

    // Check admin table instead of environment variable
    const userIsAdmin = await isAdmin(userId);

    return NextResponse.json({ isStreamer: userIsAdmin });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking streamer status:', error);
    } else {
      console.error('Error checking streamer status');
    }
    return NextResponse.json({ isStreamer: false });
  }
}

