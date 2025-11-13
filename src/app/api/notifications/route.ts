/**
 * Email Notifications API
 * Send and manage email notifications
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  listEmailNotifications,
  sendStoryPageNotification,
} from '@/services/EmailService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { z } from 'zod';

/**
 * Validation schema for sending notifications
 */
const sendNotificationSchema = z.object({
  type: z.enum(['story_page_published', 'module_completed', 'session_reminder', 'survey_reminder']),
  recipientUserId: z.string().uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
  storyPageId: z.string().uuid().optional(),
  storyPageTitle: z.string().optional(),
  therapistName: z.string().optional(),
  customMessage: z.string().max(1000).optional(),
});

/**
 * GET /api/notifications - List email notifications
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Only therapists and admins can view notifications
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot access this endpoint' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const recipientUserId = searchParams.get('recipientUserId') || undefined;
    const storyPageId = searchParams.get('storyPageId') || undefined;
    const status = searchParams.get('status') as any || undefined;
    const type = searchParams.get('type') as any || undefined;
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    const notifications = await listEmailNotifications({
      recipientUserId,
      storyPageId,
      status,
      type,
      limit,
      offset,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/notifications - Send email notification
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Only therapists and admins can send notifications
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot send notifications' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = sendNotificationSchema.parse(body);

    // Handle different notification types
    if (validated.type === 'story_page_published') {
      if (!validated.storyPageId || !validated.storyPageTitle || !validated.therapistName) {
        return NextResponse.json(
          {
            error: 'Missing required fields for story page notification: storyPageId, storyPageTitle, therapistName',
          },
          { status: 400 },
        );
      }

      const storyPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/patient/story/${validated.storyPageId}`;

      const notification = await sendStoryPageNotification({
        patientEmail: validated.recipientEmail,
        patientName: validated.recipientName,
        patientUserId: validated.recipientUserId,
        therapistName: validated.therapistName,
        storyPageTitle: validated.storyPageTitle,
        storyPageUrl,
        storyPageId: validated.storyPageId,
        customMessage: validated.customMessage,
      });

      return NextResponse.json(
        {
          message: 'Notification sent successfully',
          notification,
        },
        { status: 201 },
      );
    }

    // TODO: Implement other notification types
    return NextResponse.json(
      { error: `Notification type '${validated.type}' not yet implemented` },
      { status: 501 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }
    return handleAuthError(error);
  }
}
