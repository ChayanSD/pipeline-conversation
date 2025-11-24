import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

const COOKIE_NAME = 'session_id';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API routes - let them handle their own authentication
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionId) {
      // No session cookie, redirect to signin
      const signinUrl = new URL('/signin', request.url);
      return NextResponse.redirect(signinUrl);
    }

    // Check if session exists in Redis
    const sessionKey = `session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      // Session doesn't exist or expired, redirect to signin
      const signinUrl = new URL('/signin', request.url);
      return NextResponse.redirect(signinUrl);
    }

    // User is authenticated, allow the request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to signin for safety
    const signinUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signinUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

