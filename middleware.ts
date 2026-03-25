import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Debug: Log PocketBase URL
console.log('[Middleware] PocketBase URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/register', '/proposals', '/docs'];

// Routes that should always redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

// Routes that should be accessible to authenticated users (NOT in publicRoutes)
const protectedRoutes = ['/dashboard', '/admin', '/users', '/appointments', '/campaigns', '/leads'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const pbCookie = request.cookies.get('pb_auth');

  console.log('[Middleware] Path:', path, 'Has cookie:', !!pbCookie);

  // Check if user is authenticated
  let isAuthenticated = false;
  if (pbCookie?.value) {
    try {
      pb.authStore.clear();
      pb.authStore.loadFromCookie(`pb_auth=${pbCookie.value}`);
      const token = pb.authStore.token;
      console.log('[Middleware] Token found:', !!token);
      if (token && token.length > 0) {
        // Token varsa authenticated kabul et (auth refresh opsiyonel)
        isAuthenticated = true;
        console.log('[Middleware] Auth: SUCCESS (token valid)');

        // Auth refresh'i arka planda dene ama başarısız olsa bile engelleme
        pb.collection('users').authRefresh().catch((err) => {
          console.log('[Middleware] Auth refresh failed (non-blocking):', err.message);
          // Token hala geçerli olabilir, kullanıcı giriş yapmış demektir
        });
      }
    } catch (error) {
      console.warn('[Middleware] Auth validation failed:', error);
      isAuthenticated = false;
    }
  } else {
    console.log('[Middleware] No cookie found');
  }

  // Allow public routes without authentication
  if (publicRoutes.some(route => path === route || path.startsWith(route + '/'))) {
    console.log('[Middleware] Public route matched');
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authRoutes.some(route => path === route)) {
      console.log('[Middleware] Redirecting authenticated user from auth page');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Allow authenticated users to access protected routes
  if (isAuthenticated) {
    console.log('[Middleware] Authenticated, allowing access');
    return NextResponse.next();
  }

  // Unauthenticated users trying to access protected routes -> redirect to login
  console.log('[Middleware] Not authenticated, redirecting to login');
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', path);
  return NextResponse.redirect(loginUrl);
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
