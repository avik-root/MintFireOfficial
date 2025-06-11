
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_BASE_URL = '/admin/dashboard';
// const AUTH_COOKIE_NAME = 'admin-auth-token'; // No longer used for enforcement

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`Middleware: Processing request for ${pathname}`);

  // If trying to access the login page, and we are removing auth,
  // we might want to redirect directly to dashboard or just allow it.
  // For simplicity now, if someone hits /admin/login, let them go to the dashboard.
  if (pathname === ADMIN_LOGIN_URL) {
    console.log(`Middleware: Request to login page, redirecting to dashboard as auth is removed.`);
    return NextResponse.redirect(new URL(ADMIN_DASHBOARD_BASE_URL, request.url));
  }

  // For any admin dashboard route, allow access.
  if (pathname.startsWith(ADMIN_DASHBOARD_BASE_URL)) {
    console.log(`Middleware: Allowing access to dashboard route ${pathname} as auth is removed.`);
    return NextResponse.next();
  }

  // For any other path not covered above
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/login',
    '/admin/dashboard/:path*',
  ],
};
