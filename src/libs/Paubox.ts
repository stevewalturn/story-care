/**
 * Paubox Email API Client
 * HIPAA-compliant email service for healthcare applications
 *
 * Authentication: Custom token format "Token token={API_KEY}"
 * Base URL: https://api.paubox.net/v1/{api_username}
 */

import type {
  PauboxConfig,
  PauboxErrorResponse,
  PauboxMessage,
  PauboxMessageReceiptResponse,
  PauboxSendRequest,
  PauboxSendResponse,
  PauboxSendResult,
} from '@/types/Paubox';

/**
 * Paubox API Client
 * Handles HIPAA-compliant email sending with retry logic
 */
export class PauboxClient {
  private readonly apiKey: string;
  private readonly apiUsername: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: PauboxConfig) {
    this.apiKey = config.apiKey;
    this.apiUsername = config.apiUsername;
    this.baseUrl = config.baseUrl || 'https://api.paubox.net/v1';
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Send a single email via Paubox
   * Implements retry logic with exponential backoff for transient failures
   */
  async sendEmail(
    message: PauboxMessage,
    options?: {
      enableOpenTracking?: boolean;
      enableLinkTracking?: boolean;
      unsubscribeUrl?: string;
    },
  ): Promise<PauboxSendResult> {
    const requestBody: PauboxSendRequest = {
      data: {
        message,
        override_open_tracking: options?.enableOpenTracking ?? true,
        override_link_tracking: options?.enableLinkTracking ?? true,
        unsubscribe_url: options?.unsubscribeUrl,
      },
    };

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await this.makeRequest<PauboxSendResponse>(
          'POST',
          '/messages',
          requestBody,
          attempt,
        );

        return {
          success: true,
          sourceTrackingId: response.sourceTrackingId,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          // Non-retryable error (4xx client errors)
          return {
            success: false,
            error: this.extractErrorMessage(error),
            errorCode: this.extractErrorCode(error),
          };
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= this.maxRetries) {
          break;
        }

        // Wait with exponential backoff before retrying
        await this.sleep(this.calculateBackoff(attempt));
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError?.message || 'Failed to send email after multiple attempts',
      errorCode: 'MAX_RETRIES_EXCEEDED',
    };
  }

  /**
   * Get message delivery receipt
   * Used to check delivery status of a previously sent message
   */
  async getMessageReceipt(sourceTrackingId: string): Promise<PauboxMessageReceiptResponse | null> {
    try {
      const response = await this.makeRequest<PauboxMessageReceiptResponse>(
        'GET',
        `/messages/${sourceTrackingId}`,
      );
      return response;
    } catch (error) {
      console.error('Failed to get message receipt:', error);
      return null;
    }
  }

  /**
   * Make HTTP request to Paubox API
   * Handles authentication and error parsing
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    attempt: number = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}/${this.apiUsername}${path}`;

    // IMPORTANT: Paubox uses custom auth format, NOT Bearer token
    const headers: Record<string, string> = {
      'Authorization': `Token token=${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new PauboxApiError(
          response.status,
          response.statusText,
          errorBody as PauboxErrorResponse,
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms (attempt ${attempt + 1}/${this.maxRetries})`);
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable
   * 5xx server errors and network errors are retryable
   * 4xx client errors are not retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof PauboxApiError) {
      // Retry server errors (5xx) and rate limit errors (429)
      return error.statusCode >= 500 || error.statusCode === 429;
    }

    // Retry network errors and timeouts
    if (error instanceof Error) {
      return (
        error.message.includes('timeout')
        || error.message.includes('network')
        || error.message.includes('ECONNREFUSED')
      );
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   * Formula: min(baseDelay * 2^attempt, maxDelay)
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract error message from error object
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof PauboxApiError) {
      if (error.errorResponse?.errors?.[0]) {
        return error.errorResponse.errors[0].detail || error.errorResponse.errors[0].title;
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * Extract error code from error object
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (error instanceof PauboxApiError) {
      return error.errorResponse?.errors?.[0]?.code;
    }
    return undefined;
  }
}

/**
 * Custom error class for Paubox API errors
 */
export class PauboxApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusText: string,
    public readonly errorResponse?: PauboxErrorResponse,
  ) {
    super(`Paubox API Error: ${statusCode} ${statusText}`);
    this.name = 'PauboxApiError';
  }
}

/**
 * Singleton instance of Paubox client
 * Lazy initialization to avoid errors if env vars are missing
 */
let pauboxClientInstance: PauboxClient | null = null;

/**
 * Get Paubox client instance
 * Creates singleton instance on first call
 */
export function getPauboxClient(): PauboxClient {
  if (!pauboxClientInstance) {
    const apiKey = process.env.PAUBOX_API_KEY;
    const apiUsername = process.env.PAUBOX_API_USERNAME;

    if (!apiKey || !apiUsername) {
      throw new Error(
        'Paubox credentials not configured. Set PAUBOX_API_KEY and PAUBOX_API_USERNAME environment variables.',
      );
    }

    pauboxClientInstance = new PauboxClient({
      apiKey,
      apiUsername,
      maxRetries: 3,
      timeout: 30000,
    });
  }

  return pauboxClientInstance;
}

/**
 * Check if Paubox is properly configured
 */
export function isPauboxConfigured(): boolean {
  return Boolean(process.env.PAUBOX_API_KEY && process.env.PAUBOX_API_USERNAME);
}
