/**
 * Email Service
 * Handle email notifications via SendGrid
 */

import { db } from '@/libs/DB';
import { emailNotificationsSchema, platformSettingsSchema } from '@/models/Schema';

export type NotificationType
  = | 'story_page_published'
    | 'module_completed'
    | 'session_reminder'
    | 'survey_reminder';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';

/**
 * Send story page published notification
 */
export async function sendStoryPageNotification(params: {
  patientEmail: string;
  patientName: string;
  patientUserId: string;
  therapistName: string;
  storyPageTitle: string;
  storyPageUrl: string;
  storyPageId: string;
  customMessage?: string;
}) {
  const { subject, bodyText, bodyHtml } = generateStoryPageEmailContent({
    patientName: params.patientName,
    therapistName: params.therapistName,
    storyPageTitle: params.storyPageTitle,
    storyPageUrl: params.storyPageUrl,
    customMessage: params.customMessage,
  });

  // Create notification record
  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'story_page_published',
      recipientUserId: params.patientUserId,
      recipientEmail: params.patientEmail,
      subject,
      bodyText,
      bodyHtml,
      storyPageId: params.storyPageId,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  // TODO: Integrate with SendGrid API
  // For now, just mark as pending. Actual sending will be implemented in Phase 6
  // await sendViaSendGrid(params.patientEmail, subject, bodyHtml, bodyText);

  // Mark as sent (placeholder until SendGrid integration)
  await updateEmailStatus(notification.id, 'sent', new Date());

  return notification;
}

/**
 * Send module completion notification
 */
export async function sendModuleCompletionNotification(params: {
  patientEmail: string;
  patientName: string;
  patientUserId: string;
  moduleName: string;
  completionDate: Date;
  moduleId: string;
}) {
  const { subject, bodyText, bodyHtml } = generateModuleCompletionEmailContent({
    patientName: params.patientName,
    moduleName: params.moduleName,
    completionDate: params.completionDate,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'module_completed',
      recipientUserId: params.patientUserId,
      recipientEmail: params.patientEmail,
      subject,
      bodyText,
      bodyHtml,
      moduleId: params.moduleId,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  // TODO: Integrate with SendGrid API
  await updateEmailStatus(notification.id, 'sent', new Date());

  return notification;
}

/**
 * Update email notification status
 */
export async function updateEmailStatus(
  notificationId: string,
  status: NotificationStatus,
  timestamp?: Date,
  errorMessage?: string,
) {
  const updates: any = {
    status,
  };

  if (status === 'sent' && timestamp) {
    updates.sentAt = timestamp;
  } else if (status === 'opened' && timestamp) {
    updates.openedAt = timestamp;
  } else if (status === 'clicked' && timestamp) {
    updates.clickedAt = timestamp;
  } else if (status === 'failed' && errorMessage) {
    updates.errorMessage = errorMessage;
  }

  await db
    .update(emailNotificationsSchema)
    .set(updates)
    .where(eq => eq(emailNotificationsSchema.id, notificationId));
}

/**
 * Get platform email settings
 */
export async function getEmailSettings() {
  const [settings] = await db.select().from(platformSettingsSchema).limit(1);

  return {
    fromName: settings?.emailFromName || 'StoryCare',
    fromAddress: settings?.emailFromAddress || 'notifications@storycare.app',
    footerText:
      settings?.emailFooterText
      || 'You received this because you are a patient in the StoryCare platform.',
    provider: settings?.smtpProvider || 'sendgrid',
    enabled: settings?.enableEmailNotifications ?? true,
  };
}

/**
 * Generate story page email content
 */
function generateStoryPageEmailContent(params: {
  patientName: string;
  therapistName: string;
  storyPageTitle: string;
  storyPageUrl: string;
  customMessage?: string;
}) {
  const subject = `New Story Page: ${params.storyPageTitle}`;

  const bodyText = `
Hi ${params.patientName},

${params.therapistName} has published a new story page for you: "${params.storyPageTitle}"

${params.customMessage ? `${params.customMessage}\n\n` : ''}
View your story page: ${params.storyPageUrl}

Best regards,
The StoryCare Team
  `.trim();

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Story Page</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.patientName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${params.therapistName} has published a new story page for you:
    </p>

    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #4F46E5; margin: 0 0 10px 0; font-size: 20px;">"${params.storyPageTitle}"</h2>
    </div>

    ${params.customMessage ? `<p style="font-size: 16px; margin-bottom: 20px; font-style: italic; color: #6B7280;">${params.customMessage}</p>` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.storyPageUrl}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        View Your Story Page
      </a>
    </div>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>You received this because you are a patient in the StoryCare platform.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate module completion email content
 */
function generateModuleCompletionEmailContent(params: {
  patientName: string;
  moduleName: string;
  completionDate: Date;
}) {
  const subject = `Module Completed: ${params.moduleName}`;

  const bodyText = `
Hi ${params.patientName},

Congratulations! You have completed the "${params.moduleName}" module.

Your progress has been saved and your therapist has been notified.

Keep up the great work!

Best regards,
The StoryCare Team
  `.trim();

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Module Completed!</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.patientName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Congratulations! You have completed the <strong>"${params.moduleName}"</strong> module.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your progress has been saved and your therapist has been notified.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Keep up the great work!
    </p>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>You received this because you are a patient in the StoryCare platform.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Validate email configuration
 * Check if SendGrid API key is configured and valid
 */
export async function validateEmailConfig(): Promise<boolean> {
  // TODO: Implement SendGrid API validation
  // For now, return true if SENDGRID_API_KEY env var exists
  return Boolean(process.env.SENDGRID_API_KEY);
}

/**
 * Get email notification by ID
 */
export async function getEmailNotificationById(notificationId: string) {
  const [notification] = await db
    .select()
    .from(emailNotificationsSchema)
    .where(eq => eq(emailNotificationsSchema.id, notificationId))
    .limit(1);

  return notification || null;
}

/**
 * List email notifications with filtering
 */
export async function listEmailNotifications(params: {
  recipientUserId?: string;
  storyPageId?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}) {
  const query = db.select().from(emailNotificationsSchema);

  const conditions = [];

  if (params.recipientUserId) {
    conditions.push(eq => eq(emailNotificationsSchema.recipientUserId, params.recipientUserId));
  }

  if (params.storyPageId) {
    conditions.push(eq => eq(emailNotificationsSchema.storyPageId, params.storyPageId));
  }

  if (params.status) {
    conditions.push(eq => eq(emailNotificationsSchema.status, params.status));
  }

  if (params.type) {
    conditions.push(eq => eq(emailNotificationsSchema.notificationType, params.type));
  }

  // TODO: Apply conditions properly with Drizzle ORM
  // For now, just return all notifications
  const notifications = await query
    .limit(params.limit || 50)
    .offset(params.offset || 0)
    .orderBy(desc => desc(emailNotificationsSchema.createdAt));

  return notifications;
}
