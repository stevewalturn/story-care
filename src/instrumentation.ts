/**
 * Server-side instrumentation for Next.js
 *
 * This file is used for server-side error handling and logging.
 * Sentry has been removed for HIPAA compliance simplification.
 * All errors are now logged to console.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js runtime - setup console logging
    console.log('[Instrumentation] Server-side logging initialized');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime - setup console logging
    console.log('[Instrumentation] Edge runtime logging initialized');
  }
}

export const onRequestError = (error: Error, request: Request) => {
  console.error('[Request Error]', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });
};
