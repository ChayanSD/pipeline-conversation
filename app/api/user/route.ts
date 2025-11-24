import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withCache } from '@/lib/cache';

export async function GET() : Promise<NextResponse>  {
  const session = await getSession();
  console.log("Session in user route:", session);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const userId = session.id;

  return withCache(`user:${userId}`, async () => {
    return NextResponse.json({
      user: session.id,
    });
  });
}