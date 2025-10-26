import { NextResponse } from 'next/server';
import { deleteSession, clearSessionCookie } from '@/lib/session';

export async function POST() : Promise<NextResponse> {
  try {
    // Delete session from Redis
    await deleteSession();
    
    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}