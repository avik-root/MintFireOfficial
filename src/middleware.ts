
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_URL = '/admin/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthToken = cookies().get('admin-auth-token');

  // If the user is trying to access the login page
  if (pathname === ADMIN_LOGIN_URL) {
    // If they are already logged in (have a token), redirect them to the dashboard
    if (adminAuthToken?.value) {
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_URL, request.url));
    }
    // Otherwise, allow access to the login page
    return NextResponse.next();
  }

  // For any other route matched by the matcher (i.e., /admin/dashboard/*)
  // an auth token is required.
  if (pathname === ADMIN_DASHBOARD_URL || pathname.startsWith(ADMIN_DASHBOARD_URL + '/')) {
    if (!adminAuthToken?.value) {
      // If no token, redirect to login
      const loginUrl = new URL(ADMIN_LOGIN_URL, request.url);
      // Optionally, add a query param to redirect back after login, e.g.:
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists, allow access to the dashboard route
    return NextResponse.next();
  }

  // This line should ideally not be reached if the matcher is correct,
  // but as a fallback, allow other non-matched requests.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/login',
    '/admin/dashboard', // Specific match for the root dashboard
    '/admin/dashboard/:path*', // Match for all sub-paths of dashboard
  ],
};
