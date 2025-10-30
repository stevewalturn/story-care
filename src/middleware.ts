import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/sessions',
  '/assets',
  '/scenes',
  '/pages',
  '/patients',
  '/groups',
  '/prompts',
  '/admin',
];

// Auth pages (sign-in, sign-up)
const authPages = ['/sign-in', '/sign-up'];

// Check if the request path starts with any protected route
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Check if the request path is an auth page
function isAuthPage(pathname: string): boolean {
  return authPages.some(page => pathname.startsWith(page));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (isProtectedRoute(pathname)) {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      // Redirect to sign-in if no session token
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // HIPAA COMPLIANCE: Verify token is valid, not expired, and not revoked
    try {
      await verifyIdToken(sessionToken);
      // Token is valid, allow access
    } catch (error) {
      // Token is expired, invalid, or revoked - force re-authentication
      console.error('Invalid session token:', error);
      const response = NextResponse.redirect(new URL('/sign-in', request.url));
      // Delete the invalid session cookie
      response.cookies.delete('session');
      return response;
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthPage(pathname)) {
    const sessionToken = request.cookies.get('session')?.value;

    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add HIPAA-compliant security headers to all responses
  const response = NextResponse.next();

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Force HTTPS connections (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );

  // Content Security Policy - Prevent XSS attacks
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.firebaseapp.com https://*.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.deepgram.com https://api.openai.com https://storage.googleapis.com",
      "media-src 'self' https://storage.googleapis.com blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  );

  // Permissions Policy - Restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );

  // Referrer Policy - Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove server information
  response.headers.delete('X-Powered-By');

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
