/**
 * Client-side instrumentation for Next.js
 *
 * This file is used for client-side error handling and logging.
 * Sentry has been removed for HIPAA compliance simplification.
 * All errors are now logged to console.
 */

// Initialize client-side error logging
if (typeof window !== 'undefined') {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString(),
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString(),
    });
  });
}

export const onRouterTransitionStart = () => {
  // Router transition tracking (for analytics)
};
