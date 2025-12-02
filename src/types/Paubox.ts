/**
 * Paubox Email API Type Definitions
 * HIPAA-compliant email service for healthcare applications
 * @see https://docs.paubox.com/docs/api/email-api
 */

/**
 * Email message content with HTML and plain text
 */
export interface PauboxMessageContent {
  'text/html'?: string;
  'text/plain'?: string;
}

/**
 * Email message headers
 */
export interface PauboxMessageHeaders {
  subject: string;
  from: string;
  'reply-to'?: string;
}

/**
 * Email attachment
 */
export interface PauboxAttachment {
  fileName: string;
  contentType: string;
  content: string; // Base64 encoded
}

/**
 * Single email message structure
 */
export interface PauboxMessage {
  recipients: string[];
  headers: PauboxMessageHeaders;
  content: PauboxMessageContent;
  attachments?: PauboxAttachment[];
}

/**
 * Request body for sending a single email
 */
export interface PauboxSendRequest {
  data: {
    message: PauboxMessage;
    override_open_tracking?: boolean;
    override_link_tracking?: boolean;
    unsubscribe_url?: string;
  };
}

/**
 * Response from Paubox send email API
 */
export interface PauboxSendResponse {
  data: string; // "Service OK"
  sourceTrackingId: string; // UUID for tracking this message
  customHeaders?: Record<string, string>;
}

/**
 * Delivery status from Paubox
 */
export type PauboxDeliveryStatus
  = | 'pending'
    | 'delivered'
    | 'bounced'
    | 'opened'
    | 'clicked'
    | 'failed';

/**
 * Delivery information for a message
 */
export interface PauboxMessageDelivery {
  recipient: string;
  status: PauboxDeliveryStatus;
  deliveredAt?: string; // ISO 8601 timestamp
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
}

/**
 * Click tracking data
 */
export interface PauboxClickData {
  url: string;
  clickedAt: string;
}

/**
 * Response from get message receipt API
 */
export interface PauboxMessageReceiptResponse {
  data: {
    message: {
      id: string;
      status: PauboxDeliveryStatus;
      deliveries: PauboxMessageDelivery[];
      clicks?: PauboxClickData[];
    };
  };
  sourceTrackingId: string;
}

/**
 * Error response from Paubox API
 */
export interface PauboxErrorResponse {
  errors: Array<{
    code: string;
    title: string;
    detail: string;
  }>;
}

/**
 * Webhook event types from Paubox
 */
export type PauboxWebhookEventType
  = | 'message.delivered'
    | 'message.bounced'
    | 'message.opened'
    | 'message.clicked';

/**
 * Webhook payload from Paubox
 */
export interface PauboxWebhookEvent {
  event: PauboxWebhookEventType;
  data: {
    sourceTrackingId: string;
    recipient: string;
    timestamp: string; // ISO 8601
    status?: PauboxDeliveryStatus;
    bounceReason?: string;
    clickedUrl?: string;
  };
}

/**
 * Configuration for Paubox client
 */
export interface PauboxConfig {
  apiKey: string;
  apiUsername: string;
  baseUrl?: string; // Optional override for testing
  timeout?: number; // Request timeout in milliseconds
  maxRetries?: number; // Maximum retry attempts
}

/**
 * Send email result
 */
export interface PauboxSendResult {
  success: boolean;
  sourceTrackingId?: string;
  error?: string;
  errorCode?: string;
}
