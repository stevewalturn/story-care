/**
 * Paubox Webhook Handler
 * Receives delivery tracking events from Paubox Email API
 * HIPAA Compliant: All events are logged for audit trail
 */

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { emailNotificationsSchema } from '@/models/Schema';
import type { PauboxWebhookEvent } from '@/types/Paubox';

/**
 * POST /api/webhooks/paubox
 * Receives webhook events from Paubox for delivery tracking
 *
 * Event Types:
 * - message.delivered: Email was successfully delivered
 * - message.bounced: Email bounced (invalid address, inbox full, etc.)
 * - message.opened: Recipient opened the email
 * - message.clicked: Recipient clicked a link in the email
 *
 * This endpoint is public (no authentication) but should be secured via:
 * - Webhook signature verification (if Paubox provides it)
 * - Rate limiting (configured in middleware)
 * - IP allowlisting (optional, in production)
 */
export async function POST(request: Request) {
  try {
    // Parse webhook payload
    const body = await request.json();
    const event = body as PauboxWebhookEvent;

    // Log webhook receipt for audit trail (HIPAA requirement)
    console.log('Paubox webhook received:', {
      event: event.event,
      sourceTrackingId: event.data.sourceTrackingId,
      recipient: hashEmail(event.data.recipient), // Hash email for privacy
      timestamp: event.data.timestamp,
    });

    // Find email notification by external ID (sourceTrackingId)
    const [notification] = await db
      .select()
      .from(emailNotificationsSchema)
      .where(eq(emailNotificationsSchema.externalId, event.data.sourceTrackingId))
      .limit(1);

    if (!notification) {
      // Notification not found - log warning but return 200 (idempotent)
      console.warn('Email notification not found for sourceTrackingId:', event.data.sourceTrackingId);
      return NextResponse.json({
        success: true,
        message: 'Webhook received (notification not found)',
      });
    }

    // Process event based on type
    switch (event.event) {
      case 'message.delivered':
        await handleDelivered(notification.id, event);
        break;

      case 'message.bounced':
        await handleBounced(notification.id, event);
        break;

      case 'message.opened':
        await handleOpened(notification.id, event);
        break;

      case 'message.clicked':
        await handleClicked(notification.id, event);
        break;

      default:
        console.warn('Unknown webhook event type:', event.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    // Log error but still return 200 to prevent Paubox retries
    console.error('Error processing Paubox webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 200 }, // Return 200 even on error to prevent retries
    );
  }
}

/**
 * Handle message delivered event
 * Update status to 'sent' and set sentAt timestamp
 */
async function handleDelivered(notificationId: string, event: PauboxWebhookEvent) {
  try {
    await db
      .update(emailNotificationsSchema)
      .set({
        status: 'sent',
        sentAt: new Date(event.data.timestamp),
      })
      .where(eq(emailNotificationsSchema.id, notificationId));

    console.log('Email marked as delivered:', notificationId);
  } catch (error) {
    console.error('Failed to update delivered status:', error);
  }
}

/**
 * Handle message bounced event
 * Update status to 'bounced' and store bounce reason
 */
async function handleBounced(notificationId: string, event: PauboxWebhookEvent) {
  try {
    await db
      .update(emailNotificationsSchema)
      .set({
        status: 'bounced',
        errorMessage: event.data.bounceReason || 'Email bounced',
      })
      .where(eq(emailNotificationsSchema.id, notificationId));

    console.log('Email marked as bounced:', notificationId, event.data.bounceReason);
  } catch (error) {
    console.error('Failed to update bounced status:', error);
  }
}

/**
 * Handle message opened event
 * Update status to 'opened' and set openedAt timestamp
 */
async function handleOpened(notificationId: string, event: PauboxWebhookEvent) {
  try {
    await db
      .update(emailNotificationsSchema)
      .set({
        status: 'opened',
        openedAt: new Date(event.data.timestamp),
      })
      .where(eq(emailNotificationsSchema.id, notificationId));

    console.log('Email marked as opened:', notificationId);
  } catch (error) {
    console.error('Failed to update opened status:', error);
  }
}

/**
 * Handle message clicked event
 * Update status to 'clicked' and set clickedAt timestamp
 */
async function handleClicked(notificationId: string, event: PauboxWebhookEvent) {
  try {
    await db
      .update(emailNotificationsSchema)
      .set({
        status: 'clicked',
        clickedAt: new Date(event.data.timestamp),
      })
      .where(eq(emailNotificationsSchema.id, notificationId));

    console.log('Email marked as clicked:', notificationId, event.data.clickedUrl);
  } catch (error) {
    console.error('Failed to update clicked status:', error);
  }
}

/**
 * Hash email address for privacy in logs
 * Uses simple hash function for demonstration
 * In production, consider using crypto.createHash('sha256')
 */
function hashEmail(email: string): string {
  // Simple hash for demonstration
  // In production, use: crypto.createHash('sha256').update(email).digest('hex')
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0])
    return '***';
  return `${parts[0].substring(0, 2)}***@${parts[1]}`;
}
