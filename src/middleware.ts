import type { NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';

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

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verify the request with Arcjet
  // Use `process.env` instead of Env to reduce bundle size in middleware
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

    // Session cookie is set by /api/auth/session endpoint
    // The cookie contains the Firebase ID token
    // In production with more traffic, verify the token with Firebase Admin SDK
    // to prevent unauthorized access with expired or invalid tokens
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthPage(pathname)) {
    const sessionToken = request.cookies.get('session')?.value;

    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
