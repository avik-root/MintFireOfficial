
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_BASE_URL = '/admin/dashboard';
const AUTH_COOKIE_NAME = 'admin-auth-token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthToken = request.cookies.get(AUTH_COOKIE_NAME);

  // If trying to access the login page
  if (pathname === ADMIN_LOGIN_URL) {
    // If already authenticated, redirect to dashboard
    if (adminAuthToken?.value) {
      console.log(`Middleware: User authenticated, redirecting from ${pathname} to ${ADMIN_DASHBOARD_BASE_URL}`);
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_BASE_URL, request.url));
    }
    // Otherwise, allow access to login page
    console.log(`Middleware: User not authenticated, allowing access to ${pathname}`);
    return NextResponse.next();
  }

  // If trying to access any admin dashboard route
  if (pathname.startsWith(ADMIN_DASHBOARD_BASE_URL)) {
    // If not authenticated, redirect to login
    if (!adminAuthToken?.value) {
      console.log(`Middleware: User not authenticated, redirecting from ${pathname} to ${ADMIN_LOGIN_URL}`);
      const loginUrl = new URL(ADMIN_LOGIN_URL, request.url);
      // Optional: Add a query param to redirect back after login
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Otherwise, allow access to the dashboard route
    console.log(`Middleware: User authenticated, allowing access to ${pathname}`);
    return NextResponse.next();
  }

  // For any other path not covered above (should not happen with the current matcher)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/login',
    '/admin/dashboard/:path*', // Matches /admin/dashboard and all its sub-paths
  ],
};
