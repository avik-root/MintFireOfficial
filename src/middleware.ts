
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

  // For any admin dashboard route
  // This check is okay because the matcher limits when this middleware runs.
  if (pathname.startsWith(ADMIN_DASHBOARD_URL)) {
    if (!adminAuthToken?.value) {
      // If no token, redirect to login
      const loginUrl = new URL(ADMIN_LOGIN_URL, request.url);
      // Optionally, add a query param to redirect back after login:
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists, allow access to the dashboard route
    return NextResponse.next();
  }

  // Fallback for paths not explicitly handled by the above logic but still matched by the matcher.
  // If the matcher is precise (as it is), this might not be strictly necessary for /admin/dashboard paths,
  // but it's a safe default.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/login',
    '/admin/dashboard/:path*', // This matches /admin/dashboard and /admin/dashboard/subpath
  ],
};
