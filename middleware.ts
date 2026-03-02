import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/register'];

// Routes that redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const pbCookie = request.cookies.get('pb_auth');

  // Check if user is authenticated
  let isAuthenticated = false;
  if (pbCookie?.value) {
    try {
      // Clear any existing auth state first
      pb.authStore.clear();
      // Load the cookie value directly - the format should be "pb_auth=<value>"
      pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
      // Check if we have a token and it's valid format
      const token = pb.authStore.token;
      if (token && token.length > 0) {
        // Try to validate with the server
        try {
          await pb.collection('users').authRefresh();
          isAuthenticated = true;
        } catch (refreshError) {
          // Token is invalid or expired
          isAuthenticated = false;
        }
      }
    } catch (error) {
      // Invalid token format, continue as unauthenticated
      console.warn('Auth validation failed:', error);
      isAuthenticated = false;
    }
  }

  // Allow public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/leads', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
