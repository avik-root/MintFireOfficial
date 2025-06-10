
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_URL = '/admin/dashboard';
const PUBLIC_FILES = /\.(.*)$/; // Regex to match file extensions like .png, .css, etc.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthToken = cookies().get('admin-auth-token');

  // Allow requests for public files (images, css, etc.) within /admin/dashboard to pass through
  // This is important if your dashboard pages directly reference assets that don't require auth check
  // However, typically, assets are in /public and don't trigger middleware based on the matcher.
  // This check is more for assets served from within route handlers that might be caught by the matcher.
  if (pathname.startsWith(ADMIN_DASHBOARD_URL) && PUBLIC_FILES.test(pathname)) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname === ADMIN_DASHBOARD_URL || pathname.startsWith(ADMIN_DASHBOARD_URL + '/')) {
    if (!adminAuthToken?.value) {
      // If no token, redirect to login
      const loginUrl = new URL(ADMIN_LOGIN_URL, request.url);
      // You can add a redirect query parameter if you want to redirect back after login
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists, allow access
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (pathname === ADMIN_LOGIN_URL) {
    if (adminAuthToken?.value) {
      // If token exists, redirect to dashboard
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_URL, request.url));
    }
    // No token, allow access to login page
    return NextResponse.next();
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/login',
    '/admin/dashboard', // Specific match for the root dashboard
    '/admin/dashboard/:path*', // Match for all sub-paths of dashboard
  ],
};
