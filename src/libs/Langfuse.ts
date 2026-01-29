/**
 * Langfuse Client Singleton
 * AI Observability and Cost Tracking
 * Documentation: https://langfuse.com/docs
 */

import { Langfuse } from 'langfuse';

let langfuseInstance: Langfuse | null = null;

/**
 * Check if Langfuse is configured
 */
export function isLangfuseConfigured(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY
    && process.env.LANGFUSE_SECRET_KEY
  );
}

/**
 * Get Langfuse client instance (singleton)
 * Returns null if not configured (graceful degradation)
 */
export function getLangfuse(): Langfuse | null {
  if (!isLangfuseConfigured()) {
    return null;
  }

  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });
  }

  return langfuseInstance;
}

/**
 * Flush all pending events to Langfuse
 * Call this before process exit or at the end of request handlers
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.flushAsync();
  }
}

/**
 * Shutdown Langfuse client and flush pending events
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    langfuseInstance = null;
  }
}
