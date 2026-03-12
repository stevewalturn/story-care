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
  '/super-admin',
  '/org-admin',
  '/patient',
];

// Auth pages (sign-in)
const authPages = ['/sign-in'];

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

  // Skip auth checks for API routes - they handle their own authentication
  // But still apply security headers at the end
  const isApiRoute = pathname.startsWith('/api/');

  if (!isApiRoute) {
    // Redirect root to sign-in (landing page is now on a separate deployment)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

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
  }

  // Add HIPAA-compliant security headers to all responses (including API routes)
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
      'default-src \'self\'',
      'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://cdn.jsdelivr.net https://*.firebaseapp.com https://*.googleapis.com https://www.google.com https://www.gstatic.com https://widget.intercom.io https://js.intercomcdn.com',
      'style-src \'self\' \'unsafe-inline\'',
      'img-src \'self\' data: https: blob:',
      'font-src \'self\' data: https://js.intercomcdn.com',
      'connect-src \'self\' https://*.firebaseapp.com https://*.googleapis.com https://*.deepgram.com https://api.openai.com https://storage.googleapis.com https://*.intercom.io https://*.intercomcdn.com https://*.intercomassets.com',
      'media-src \'self\' https://storage.googleapis.com blob: https://js.intercomcdn.com',
      'frame-src \'self\' https://www.google.com https://recaptcha.google.com https://intercom-sheets.com https://*.intercom.io',
      'object-src \'none\'',
      'base-uri \'self\'',
      'form-action \'self\'',
      'frame-ancestors \'none\'',
      'upgrade-insecure-requests',
    ].join('; '),
  );

  // Permissions Policy - Restrict browser features
  // Note: microphone=(self) is required for voice recording feature
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
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
  // - … API upload routes (to avoid body consumption issues with large files)
  matcher: '/((?!_next|_vercel|monitoring|api/sessions/upload|api/sessions/upload-url|api/sessions/upload-confirm|api/media/upload|.*\\..*).*)',
  runtime: 'nodejs',
};
