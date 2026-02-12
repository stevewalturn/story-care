/**
 * Email Service
 * Handle email notifications via SendGrid
 */

import type { PauboxMessage } from '@/types/Paubox';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { getPauboxClient, isPauboxConfigured } from '@/libs/Paubox';
import { emailNotificationsSchema, platformSettingsSchema } from '@/models/Schema';

export type NotificationType
  = | 'story_page_published'
    | 'module_completed'
    | 'session_reminder'
    | 'survey_reminder'
    | 'therapist_invitation'
    | 'patient_invitation'
    | 'org_admin_invitation';

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

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.patientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

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

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.patientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

  return notification;
}

/**
 * Send therapist invitation email
 */
export async function sendTherapistInvitationEmail(params: {
  therapistEmail: string;
  therapistName: string;
  therapistUserId: string;
  inviterName: string;
  organizationName: string;
  setupAccountUrl: string;
  expiresAt?: Date;
}) {
  const { subject, bodyText, bodyHtml } = generateTherapistInvitationEmailContent({
    therapistName: params.therapistName,
    inviterName: params.inviterName,
    organizationName: params.organizationName,
    setupAccountUrl: params.setupAccountUrl,
    expiresAt: params.expiresAt,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'therapist_invitation',
      recipientUserId: params.therapistUserId,
      recipientEmail: params.therapistEmail,
      subject,
      bodyText,
      bodyHtml,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.therapistEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

  return notification;
}

/**
 * Send patient invitation email
 */
export async function sendPatientInvitationEmail(params: {
  patientEmail: string;
  patientName: string;
  patientUserId: string;
  therapistName: string;
  therapistId: string;
  therapistAvatarUrl?: string;
  setupAccountUrl: string;
  welcomeMessage?: string;
  expiresAt?: Date;
}) {
  const { subject, bodyText, bodyHtml } = generatePatientInvitationEmailContent({
    patientName: params.patientName,
    therapistName: params.therapistName,
    therapistAvatarUrl: params.therapistAvatarUrl,
    setupAccountUrl: params.setupAccountUrl,
    welcomeMessage: params.welcomeMessage,
    expiresAt: params.expiresAt,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'patient_invitation',
      recipientUserId: params.patientUserId,
      recipientEmail: params.patientEmail,
      subject,
      bodyText,
      bodyHtml,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.patientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

  return notification;
}

/**
 * Send org admin invitation email
 */
export async function sendOrgAdminInvitationEmail(params: {
  orgAdminEmail: string;
  orgAdminName: string;
  orgAdminUserId: string;
  inviterName: string;
  organizationName: string;
  setupAccountUrl: string;
  expiresAt?: Date;
}) {
  const { subject, bodyText, bodyHtml } = generateOrgAdminInvitationEmailContent({
    orgAdminName: params.orgAdminName,
    inviterName: params.inviterName,
    organizationName: params.organizationName,
    setupAccountUrl: params.setupAccountUrl,
    expiresAt: params.expiresAt,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'org_admin_invitation',
      recipientUserId: params.orgAdminUserId,
      recipientEmail: params.orgAdminEmail,
      subject,
      bodyText,
      bodyHtml,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    console.log('📧 EmailService: Preparing to send org admin invitation email:', {
      recipientEmail: params.orgAdminEmail,
      recipientName: params.orgAdminName,
      organizationName: params.organizationName,
      inviterName: params.inviterName,
      notificationId: notification.id,
    });

    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.orgAdminEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    console.log('📧 EmailService: Paubox message constructed:', {
      recipients: message.recipients,
      subject: message.headers.subject,
      from: message.headers.from,
      hasHtmlContent: !!message.content['text/html'],
      hasTextContent: !!message.content['text/plain'],
    });

    console.log('📧 EmailService: Calling Paubox API...');
    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    console.log('📧 EmailService: Paubox API call completed:', {
      success: result.success,
      sourceTrackingId: result.sourceTrackingId,
      error: result.error,
      errorCode: result.errorCode,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));

      console.log('✅ EmailService: Email marked as sent in database:', {
        notificationId: notification.id,
        trackingId: result.sourceTrackingId,
        recipientEmail: params.orgAdminEmail,
      });
    } else {
      // Email send failed
      console.error('❌ EmailService: Email send failed:', {
        notificationId: notification.id,
        recipientEmail: params.orgAdminEmail,
        error: result.error,
        errorCode: result.errorCode,
      });

      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('❌ EmailService: Exception while sending email via Paubox:', {
      notificationId: notification.id,
      recipientEmail: params.orgAdminEmail,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

  return notification;
}

/**
 * Send session reminder email
 */
export async function sendSessionReminderEmail(params: {
  patientEmail: string;
  patientName: string;
  patientUserId: string;
  therapistName: string;
  sessionDate: Date;
  sessionId: string;
  sessionNotes?: string;
}) {
  const { subject, bodyText, bodyHtml } = generateSessionReminderEmailContent({
    patientName: params.patientName,
    therapistName: params.therapistName,
    sessionDate: params.sessionDate,
    sessionNotes: params.sessionNotes,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'session_reminder',
      recipientUserId: params.patientUserId,
      recipientEmail: params.patientEmail,
      subject,
      bodyText,
      bodyHtml,
      sessionId: params.sessionId,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.patientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

  return notification;
}

/**
 * Send survey reminder email
 */
export async function sendSurveyReminderEmail(params: {
  patientEmail: string;
  patientName: string;
  patientUserId: string;
  surveyTitle: string;
  surveyUrl: string;
  storyPageId: string;
  dueDate?: Date;
}) {
  const { subject, bodyText, bodyHtml } = generateSurveyReminderEmailContent({
    patientName: params.patientName,
    surveyTitle: params.surveyTitle,
    surveyUrl: params.surveyUrl,
    dueDate: params.dueDate,
  });

  const [notification] = await db
    .insert(emailNotificationsSchema)
    .values({
      notificationType: 'survey_reminder',
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

  if (!notification) {
    throw new Error('Failed to create email notification record');
  }

  // Get email settings from platform configuration
  const emailSettings = await getEmailSettings();

  console.log('📧 Email settings retrieved:', {
    enabled: emailSettings.enabled,
    fromName: emailSettings.fromName,
    fromAddress: emailSettings.fromAddress,
    provider: emailSettings.provider,
  });

  if (!emailSettings.enabled) {
    console.warn('⚠️ Email notifications are disabled in platform settings');
    await updateEmailStatus(notification.id, 'failed', undefined, 'Email notifications disabled');
    return notification;
  }

  // Send email via Paubox
  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.patientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message, {
      enableOpenTracking: true,
      enableLinkTracking: true,
    });

    if (result.success && result.sourceTrackingId) {
      // Store Paubox tracking ID and mark as sent
      await db
        .update(emailNotificationsSchema)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalId: result.sourceTrackingId,
        })
        .where(eq(emailNotificationsSchema.id, notification.id));
    } else {
      // Email send failed
      await updateEmailStatus(
        notification.id,
        'failed',
        undefined,
        result.error || 'Unknown error',
      );
    }
  } catch (error) {
    console.error('Failed to send email via Paubox:', error);
    await updateEmailStatus(
      notification.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Failed to send email',
    );
  }

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
    .where(eq(emailNotificationsSchema.id, notificationId));
}

/**
 * Get platform email settings
 */
export async function getEmailSettings() {
  try {
    const [settings] = await db.select().from(platformSettingsSchema).limit(1);

    if (!settings) {
      console.warn('⚠️ No platform settings found in database. Using default email configuration.');
      console.warn('⚠️ To fix this, run the database migration: npm run db:migrate');
    }

    return {
      fromName: settings?.emailFromName || 'StoryCare',
      fromAddress: settings?.emailFromAddress || 'notifications@storycare.health',
      footerText:
        settings?.emailFooterText
        || 'You received this because you are a user in the StoryCare platform.',
      provider: settings?.smtpProvider || 'paubox',
      enabled: settings?.enableEmailNotifications ?? true, // Default to enabled if not set
    };
  } catch (error) {
    console.error('❌ Failed to fetch platform settings:', error);
    console.warn('⚠️ Using default email configuration as fallback');

    // Return defaults if database query fails
    return {
      fromName: 'StoryCare',
      fromAddress: 'notifications@storycare.health',
      footerText: 'You received this because you are a user in the StoryCare platform.',
      provider: 'paubox',
      enabled: true, // Default to enabled
    };
  }
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
 * Generate therapist invitation email content
 */
function generateTherapistInvitationEmailContent(params: {
  therapistName: string;
  inviterName: string;
  organizationName: string;
  setupAccountUrl: string;
  expiresAt?: Date;
}) {
  const subject = `You're invited to join ${params.organizationName} on StoryCare`;

  const expiryText = params.expiresAt
    ? `\nThis invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\nIf it expires, please contact your administrator for a new invitation.\n`
    : '';

  const bodyText = `
Hi ${params.therapistName},

${params.inviterName} has invited you to join ${params.organizationName} on StoryCare, a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories.

To get started, please set up your account:
${params.setupAccountUrl}
${expiryText}
Once your account is set up, you'll be able to:
- Upload and manage therapy sessions
- Analyze transcripts with AI assistance
- Generate visual media for patients
- Create personalized story pages
- Monitor patient engagement

If you have any questions, please don't hesitate to reach out.

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
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to StoryCare</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.therapistName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> on StoryCare,
      a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.setupAccountUrl}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Set Up Your Account
      </a>
    </div>

    ${params.expiresAt ? `<p style="font-size: 14px; color: #EF4444; margin-bottom: 20px; text-align: center;"><strong>This invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</strong><br>If it expires, please contact your administrator for a new invitation.</p>` : ''}

    <p style="font-size: 16px; margin-bottom: 10px;"><strong>Once your account is set up, you'll be able to:</strong></p>
    <ul style="font-size: 16px; color: #4B5563; line-height: 1.8;">
      <li>Upload and manage therapy sessions</li>
      <li>Analyze transcripts with AI assistance</li>
      <li>Generate visual media for patients</li>
      <li>Create personalized story pages</li>
      <li>Monitor patient engagement</li>
    </ul>

    <p style="font-size: 16px; margin-top: 20px;">
      If you have any questions, please don't hesitate to reach out.
    </p>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>This invitation was sent by ${params.inviterName} on behalf of ${params.organizationName}.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate patient invitation email content
 */
function generatePatientInvitationEmailContent(params: {
  patientName: string;
  therapistName: string;
  therapistAvatarUrl?: string;
  setupAccountUrl: string;
  welcomeMessage?: string;
  expiresAt?: Date;
}) {
  const subject = `Welcome to StoryCare - ${params.therapistName} has invited you`;

  const expiryText = params.expiresAt
    ? `\nThis invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\nIf it expires, please contact your therapist for a new invitation.\n`
    : '';

  const bodyText = `
Hi ${params.patientName},

${params.therapistName} has invited you to join StoryCare, a digital therapeutic platform designed to help you visualize and reframe your story through personalized content.

${params.welcomeMessage ? `${params.welcomeMessage}\n\n` : ''}
To get started, please set up your account:
${params.setupAccountUrl}
${expiryText}
Once your account is set up, you'll be able to:
- View personalized story pages created by your therapist
- Watch videos and explore visual content
- Answer reflection questions
- Track your therapeutic journey

StoryCare is a secure, HIPAA-compliant platform that protects your privacy. Your information is safe with us.

If you have any questions, please reach out to ${params.therapistName}.

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
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to StoryCare</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.patientName}</strong>,</p>

    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
      ${params.therapistAvatarUrl ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${params.therapistAvatarUrl}" alt="${params.therapistName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;"></div>` : ''}
      <p style="margin: 0; font-size: 16px; text-align: center;">
        <strong style="color: #4F46E5; font-size: 18px;">${params.therapistName}</strong><br>
        <span style="color: #6B7280; font-size: 14px;">has invited you to StoryCare</span>
      </p>
    </div>

    ${params.welcomeMessage ? `<p style="font-size: 16px; margin-bottom: 20px; font-style: italic; color: #6B7280; padding: 15px; background: #F9FAFB; border-left: 4px solid #6366F1; border-radius: 4px;">"${params.welcomeMessage}"</p>` : ''}

    <p style="font-size: 16px; margin-bottom: 20px;">
      StoryCare is a digital therapeutic platform designed to help you visualize and reframe your story through personalized content created by your therapist.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.setupAccountUrl}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Accept Invitation & Get Started
      </a>
    </div>

    ${params.expiresAt ? `<p style="font-size: 14px; color: #EF4444; margin-bottom: 20px; text-align: center;"><strong>This invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</strong><br>If it expires, please contact your therapist for a new invitation.</p>` : ''}

    <p style="font-size: 16px; margin-bottom: 10px;"><strong>Once your account is set up, you'll be able to:</strong></p>
    <ul style="font-size: 16px; color: #4B5563; line-height: 1.8;">
      <li>View personalized story pages created by your therapist</li>
      <li>Watch videos and explore visual content</li>
      <li>Answer reflection questions</li>
      <li>Track your therapeutic journey</li>
    </ul>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>This is a secure, HIPAA-compliant message. Your privacy is protected.</p>
    <p>This invitation was sent by ${params.therapistName}.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate org admin invitation email content
 */
function generateOrgAdminInvitationEmailContent(params: {
  orgAdminName: string;
  inviterName: string;
  organizationName: string;
  setupAccountUrl: string;
  expiresAt?: Date;
}) {
  const subject = `Administrator invitation for ${params.organizationName} on StoryCare`;

  const expiryText = params.expiresAt
    ? `\nThis invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\nIf it expires, please contact the platform administrator for a new invitation.\n`
    : '';

  const bodyText = `
Hi ${params.orgAdminName},

${params.inviterName} has invited you to be an administrator for ${params.organizationName} on StoryCare, a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories.

To get started, please set up your account:
${params.setupAccountUrl}
${expiryText}
As an organization administrator, you'll be able to:
- Manage therapists in your organization
- View organization-wide analytics and metrics
- Configure organization settings and templates
- Monitor platform usage and engagement
- Ensure HIPAA compliance and data security

If you have any questions, please don't hesitate to reach out to ${params.inviterName}.

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
    <h1 style="color: white; margin: 0; font-size: 24px;">Administrator Invitation</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.orgAdminName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${params.inviterName}</strong> has invited you to be an administrator for <strong>${params.organizationName}</strong> on StoryCare,
      a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories.
    </p>

    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #4F46E5; margin: 0 0 10px 0; font-size: 20px;">${params.organizationName}</h2>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">Organization Administrator</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.setupAccountUrl}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Set Up Admin Account
      </a>
    </div>

    ${params.expiresAt ? `<p style="font-size: 14px; color: #EF4444; margin-bottom: 20px; text-align: center;"><strong>This invitation link will expire on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</strong><br>If it expires, please contact the platform administrator for a new invitation.</p>` : ''}

    <p style="font-size: 16px; margin-bottom: 10px;"><strong>As an organization administrator, you'll be able to:</strong></p>
    <ul style="font-size: 16px; color: #4B5563; line-height: 1.8;">
      <li>Manage therapists in your organization</li>
      <li>View organization-wide analytics and metrics</li>
      <li>Configure organization settings and templates</li>
      <li>Monitor platform usage and engagement</li>
      <li>Ensure HIPAA compliance and data security</li>
    </ul>

    <p style="font-size: 16px; margin-top: 20px;">
      If you have any questions, please don't hesitate to reach out to ${params.inviterName}.
    </p>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>This is a secure, HIPAA-compliant message. Your privacy is protected.</p>
    <p>This invitation was sent by ${params.inviterName} on behalf of ${params.organizationName}.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate session reminder email content
 */
function generateSessionReminderEmailContent(params: {
  patientName: string;
  therapistName: string;
  sessionDate: Date;
  sessionNotes?: string;
}) {
  const dateStr = params.sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = params.sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const subject = `Reminder: Session with ${params.therapistName} on ${dateStr}`;

  const bodyText = `
Hi ${params.patientName},

This is a friendly reminder about your upcoming session with ${params.therapistName}.

Date: ${dateStr}
Time: ${timeStr}

${params.sessionNotes ? `Notes: ${params.sessionNotes}\n\n` : ''}
We look forward to seeing you!

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
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📅 Session Reminder</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.patientName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      This is a friendly reminder about your upcoming session with <strong>${params.therapistName}</strong>.
    </p>

    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 Date:</strong> ${dateStr}</p>
      <p style="margin: 0; font-size: 16px;"><strong>🕐 Time:</strong> ${timeStr}</p>
    </div>

    ${params.sessionNotes ? `<p style="font-size: 16px; margin-bottom: 20px; font-style: italic; color: #6B7280;"><strong>Notes:</strong> ${params.sessionNotes}</p>` : ''}

    <p style="font-size: 16px;">
      We look forward to seeing you!
    </p>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>You received this reminder because you have an upcoming session on StoryCare.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate password reset email content
 */
function generatePasswordResetEmailContent(params: {
  resetLink: string;
}) {
  const subject = 'Reset Your StoryCare Password';

  const bodyText = `
You recently requested to reset your password for your StoryCare account.

Click the link below to reset your password:
${params.resetLink}

This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email. Your password will not be changed.

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
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      You recently requested to reset your password for your StoryCare account.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.resetLink}" style="background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>

    <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
      <p style="margin: 0; font-size: 14px; color: #92400E;">
        This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
      </p>
    </div>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>This is a secure, HIPAA-compliant message from StoryCare.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Generate survey reminder email content
 */
function generateSurveyReminderEmailContent(params: {
  patientName: string;
  surveyTitle: string;
  surveyUrl: string;
  dueDate?: Date;
}) {
  const subject = `Please complete: ${params.surveyTitle}`;

  const dueDateStr = params.dueDate
    ? params.dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const bodyText = `
Hi ${params.patientName},

You have a pending survey to complete: "${params.surveyTitle}"

${dueDateStr ? `Please complete by: ${dueDateStr}\n\n` : ''}
Your feedback is important and helps us provide better care for you.

Complete the survey: ${params.surveyUrl}

Thank you for your participation!

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
  <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Survey Reminder</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${params.patientName}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      You have a pending survey to complete:
    </p>

    <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
      <h2 style="color: #92400E; margin: 0 0 10px 0; font-size: 18px;">"${params.surveyTitle}"</h2>
      ${dueDateStr ? `<p style="margin: 0; font-size: 14px; color: #92400E;"><strong>Due:</strong> ${dueDateStr}</p>` : ''}
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Your feedback is important and helps us provide better care for you.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.surveyUrl}" style="background: #F59E0B; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Complete Survey
      </a>
    </div>

    <p style="font-size: 16px;">
      Thank you for your participation!
    </p>

    <p style="font-size: 14px; color: #6B7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      Best regards,<br>
      The StoryCare Team
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
    <p>You received this reminder because you have a pending survey on StoryCare.</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Send password reset email via Paubox (no DB notification record — transient email)
 */
export async function sendPasswordResetEmail(params: {
  recipientEmail: string;
  resetLink: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isPauboxConfigured()) {
    console.warn('Paubox not configured, cannot send password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  const emailSettings = await getEmailSettings();

  if (!emailSettings.enabled) {
    console.warn('Email notifications are disabled in platform settings');
    return { success: false, error: 'Email notifications disabled' };
  }

  const { subject, bodyText, bodyHtml } = generatePasswordResetEmailContent({
    resetLink: params.resetLink,
  });

  try {
    const paubox = getPauboxClient();

    const message: PauboxMessage = {
      recipients: [params.recipientEmail],
      headers: {
        subject,
        from: `${emailSettings.fromName} <${emailSettings.fromAddress}>`,
      },
      content: {
        'text/html': bodyHtml,
        'text/plain': bodyText,
      },
    };

    const result = await paubox.sendEmail(message);

    if (result.success) {
      return { success: true };
    }

    return { success: false, error: result.error || 'Failed to send email' };
  } catch (error) {
    console.error('Failed to send password reset email via Paubox:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Validate email configuration
 * Check if Paubox API credentials are configured
 */
export async function validateEmailConfig(): Promise<boolean> {
  return isPauboxConfigured();
}

/**
 * Get email notification by ID
 */
export async function getEmailNotificationById(notificationId: string) {
  const [notification] = await db
    .select()
    .from(emailNotificationsSchema)
    .where(eq(emailNotificationsSchema.id, notificationId))
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
    conditions.push(eq(emailNotificationsSchema.recipientUserId, params.recipientUserId));
  }

  if (params.storyPageId) {
    conditions.push(eq(emailNotificationsSchema.storyPageId, params.storyPageId));
  }

  if (params.status) {
    conditions.push(eq(emailNotificationsSchema.status, params.status));
  }

  if (params.type) {
    conditions.push(eq(emailNotificationsSchema.notificationType, params.type));
  }

  const notifications = await query
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(params.limit || 50)
    .offset(params.offset || 0)
    .orderBy(desc(emailNotificationsSchema.createdAt));

  return notifications;
}
