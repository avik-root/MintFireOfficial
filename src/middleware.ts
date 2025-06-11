
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_LOGIN_URL = '/admin/login';
const ADMIN_DASHBOARD_BASE_URL = '/admin/dashboard';
const AUTH_COOKIE_NAME = 'admin-auth-token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  console.log(`Middleware: Processing request for ${pathname}. Auth token: ${authToken ? 'present' : 'absent'}`);

  // If trying to access the login page
  if (pathname === ADMIN_LOGIN_URL) {
    if (authToken) {
      // User is authenticated and trying to access login page, redirect to dashboard
      console.log(`Middleware: Authenticated user accessing login page, redirecting to dashboard.`);
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_BASE_URL, request.url));
    }
    // User is not authenticated, allow access to login page
    console.log(`Middleware: Unauthenticated user accessing login page, allowing.`);
    return NextResponse.next();
  }

  // For any admin dashboard route
  if (pathname.startsWith(ADMIN_DASHBOARD_BASE_URL)) {
    if (!authToken) {
      // User is not authenticated, redirect to login page
      console.log(`Middleware: Unauthenticated user accessing dashboard route ${pathname}, redirecting to login.`);
      const redirectUrl = new URL(ADMIN_LOGIN_URL, request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname); // Optional: remember where they were going
      return NextResponse.redirect(redirectUrl);
    }
    // User is authenticated, allow access
    console.log(`Middleware: Authenticated user accessing dashboard route ${pathname}, allowing.`);
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
