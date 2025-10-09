import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ isStreamer: false });
    }

    const userId = (session.user as any).id;
    const streamerId = process.env.STREAMER_TWITCH_ID;

    return NextResponse.json({ isStreamer: userId === streamerId });
  } catch (error) {
    console.error('Error checking streamer status:', error);
    return NextResponse.json({ isStreamer: false });
  }
}

