/**
 * Email Notifications API
 * Send and manage email notifications
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listEmailNotifications,
  sendModuleCompletionNotification,
  sendSessionReminderEmail,
  sendStoryPageNotification,
  sendSurveyReminderEmail,
} from '@/services/EmailService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * Validation schema for sending notifications
 */
const sendNotificationSchema = z.object({
  type: z.enum(['story_page_published', 'module_completed', 'session_reminder', 'survey_reminder']),
  recipientUserId: z.string().uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),

  // Story page notification fields
  storyPageId: z.string().uuid().optional(),
  storyPageTitle: z.string().optional(),
  customMessage: z.string().max(1000).optional(),

  // Module completion fields
  moduleName: z.string().optional(),
  moduleId: z.string().uuid().optional(),
  completionDate: z.string().datetime().optional(),

  // Session reminder fields
  therapistName: z.string().optional(),
  sessionDate: z.string().datetime().optional(),
  sessionId: z.string().uuid().optional(),
  sessionNotes: z.string().optional(),

  // Survey reminder fields
  surveyTitle: z.string().optional(),
  surveyUrl: z.string().url().optional(),
  dueDate: z.string().datetime().optional(),
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
          message: 'Story page notification sent successfully',
          notification,
        },
        { status: 201 },
      );
    }

    // Module completion notification
    if (validated.type === 'module_completed') {
      if (!validated.moduleName || !validated.moduleId || !validated.completionDate) {
        return NextResponse.json(
          {
            error: 'Missing required fields for module completion notification: moduleName, moduleId, completionDate',
          },
          { status: 400 },
        );
      }

      const notification = await sendModuleCompletionNotification({
        patientEmail: validated.recipientEmail,
        patientName: validated.recipientName,
        patientUserId: validated.recipientUserId,
        moduleName: validated.moduleName,
        moduleId: validated.moduleId,
        completionDate: new Date(validated.completionDate),
      });

      return NextResponse.json(
        {
          message: 'Module completion notification sent successfully',
          notification,
        },
        { status: 201 },
      );
    }

    // Session reminder notification
    if (validated.type === 'session_reminder') {
      if (!validated.therapistName || !validated.sessionDate || !validated.sessionId) {
        return NextResponse.json(
          {
            error: 'Missing required fields for session reminder: therapistName, sessionDate, sessionId',
          },
          { status: 400 },
        );
      }

      const notification = await sendSessionReminderEmail({
        patientEmail: validated.recipientEmail,
        patientName: validated.recipientName,
        patientUserId: validated.recipientUserId,
        therapistName: validated.therapistName,
        sessionDate: new Date(validated.sessionDate),
        sessionId: validated.sessionId,
        sessionNotes: validated.sessionNotes,
      });

      return NextResponse.json(
        {
          message: 'Session reminder sent successfully',
          notification,
        },
        { status: 201 },
      );
    }

    // Survey reminder notification
    if (validated.type === 'survey_reminder') {
      if (!validated.surveyTitle || !validated.surveyUrl || !validated.storyPageId) {
        return NextResponse.json(
          {
            error: 'Missing required fields for survey reminder: surveyTitle, surveyUrl, storyPageId',
          },
          { status: 400 },
        );
      }

      const notification = await sendSurveyReminderEmail({
        patientEmail: validated.recipientEmail,
        patientName: validated.recipientName,
        patientUserId: validated.recipientUserId,
        surveyTitle: validated.surveyTitle,
        surveyUrl: validated.surveyUrl,
        storyPageId: validated.storyPageId,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      });

      return NextResponse.json(
        {
          message: 'Survey reminder sent successfully',
          notification,
        },
        { status: 201 },
      );
    }

    // Should never reach here due to type enum validation
    return NextResponse.json(
      { error: 'Invalid notification type' },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 },
      );
    }
    return handleAuthError(error);
  }
}
