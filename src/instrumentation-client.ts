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
    // Skip empty errors or events without meaningful information
    if (!event.message && !event.error && !event.filename) {
      return;
    }

    // Skip common non-critical browser errors
    const message = event.message || '';
    if (
      message.includes('ResizeObserver loop') ||
      message.includes('Script error.') ||
      message === ''
    ) {
      return;
    }

    console.error('[Global Error]', {
      message: event.message || 'Unknown error',
      filename: event.filename || 'unknown',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
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
