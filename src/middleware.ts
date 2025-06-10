
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_URL = '/admin/dashboard';
const AUTH_COOKIE_NAME = 'admin-auth-token';

export function middleware(request: NextRequest) {
  const adminAuthToken = request.cookies.get(AUTH_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // If trying to access admin dashboard routes
  if (pathname === ADMIN_DASHBOARD_URL || pathname.startsWith(ADMIN_DASHBOARD_URL + '/')) {
    if (!adminAuthToken?.value) {
      // Not authenticated, redirect to login
      const loginUrl = new URL(ADMIN_LOGIN_URL, request.url);
      loginUrl.searchParams.set('next', pathname); // Optionally pass where they were trying to go
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated, allow access
    return NextResponse.next();
  }

  // If trying to access login page
  if (pathname === ADMIN_LOGIN_URL) {
    if (adminAuthToken?.value) {
      // Already authenticated, redirect to dashboard
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_URL, request.url));
    }
    // Not authenticated, allow access to login page
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard', // Explicitly match the dashboard root
    '/admin/dashboard/:path*', // Match all sub-paths
    '/admin/login'
  ],
};
