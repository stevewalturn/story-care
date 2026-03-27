/**
 * Server-side instrumentation for Next.js
 *
 * Handles server-side error logging and Slack alerting.
 * Sentry has been removed for HIPAA compliance simplification.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js runtime - setup console logging
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime - setup console logging
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

  // Forward to Slack — fire-and-forget so we never delay the response
  import('@/libs/SlackNotifier').then(({ sendErrorAlert }) => {
    sendErrorAlert({
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      userAgent: (request as Request & { headers?: Headers }).headers?.get?.('user-agent') ?? undefined,
      ip: (request as Request & { headers?: Headers }).headers?.get?.('x-forwarded-for')
        ?? (request as Request & { headers?: Headers }).headers?.get?.('x-real-ip')
        ?? undefined,
      source: 'server',
      environment: process.env.NODE_ENV,
    }).catch(() => {});
  }).catch(() => {});
};
