/**
 * Client-side instrumentation for Next.js
 *
 * Handles browser-side error logging and Slack alerting via the internal API.
 * Sentry has been removed for HIPAA compliance simplification.
 */

/** Send a client-side error report to the server, which forwards it to Slack. */
function reportClientError(payload: {
  message: string;
  stack?: string;
  url?: string;
  source?: 'client' | 'react';
}) {
  // Best-effort POST — never throw, never await
  fetch('/api/internal/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Initialize client-side error logging
if (typeof window !== 'undefined') {
  // Global error handler
  window.addEventListener('error', (event) => {
    // Skip empty errors or events without meaningful information
    if (!event.message && !event.error && !event.filename) {
      return;
    }

    // Skip common non-critical browser noise
    const message = event.message || '';
    if (
      message.includes('ResizeObserver loop')
      || message.includes('Script error.')
      || message === ''
    ) {
      return;
    }

    console.error('[Global Error]', {
      message,
      filename: event.filename || 'unknown',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      error: event.error,
      timestamp: new Date().toISOString(),
    });

    reportClientError({
      message: message || 'Unknown browser error',
      stack: event.error?.stack,
      url: window.location.href,
      source: 'client',
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message
      = reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';

    console.error('[Unhandled Promise Rejection]', {
      reason,
      timestamp: new Date().toISOString(),
    });

    reportClientError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
      source: 'client',
    });
  });
}

export const onRouterTransitionStart = () => {
  // Router transition tracking (for analytics)
};
