/**
 * Pending Invitation Actions API
 * Approve or reject a pending user invitation
 * HIPAA Compliant: Requires super admin authentication
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { requireSuperAdmin } from '@/middleware/RBACMiddleware';
import { organizationsSchema, users } from '@/models/Schema';
import { logAuditFromRequest } from '@/services/AuditService';
import { sendPatientInvitationEmail, sendTherapistInvitationEmail } from '@/services/EmailService';
import { handleAuthError } from '@/utils/AuthHelpers';
import { calculateExpirationDate, generateInvitationToken } from '@/utils/InvitationTokens';
import { approveInvitationSchema } from '@/validations/UserValidation';

/**
 * PATCH /api/super-admin/pending-invitations/[id] - Approve or reject an invitation
 *
 * Request Body:
 * - decision: 'approve' | 'reject'
 * - rejectionReason: Optional reason for rejection
 *
 * Access Control:
 * - Super admins only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireSuperAdmin(request);
    const { id: userId } = await params;

    const body = await request.json();
    const validated = approveInvitationSchema.parse(body);

    // Fetch the user
    const [pendingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!pendingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    if (pendingUser.status !== 'pending_approval') {
      return NextResponse.json(
        { error: `Cannot process invitation. User status is '${pendingUser.status}' (expected 'pending_approval')` },
        { status: 400 },
      );
    }

    if (validated.decision === 'approve') {
      // Generate invitation token and set 7-day expiry
      const invitationToken = generateInvitationToken();
      const invitationTokenExpiresAt = calculateExpirationDate(7);

      // Update user to invited status
      await db
        .update(users)
        .set({
          status: 'invited',
          invitationToken,
          invitationTokenExpiresAt,
          invitationSentAt: new Date(),
          approvedBy: authUser.dbUserId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Send appropriate invitation email based on role
      const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const setupAccountUrl = `${appUrl}/setup-account?token=${invitationToken}`;

      try {
        if (pendingUser.role === 'patient') {
          // Get therapist details for patient invitation email
          let therapistName = 'Your Therapist';
          let therapistId = '';
          let therapistAvatarUrl: string | undefined;

          if (pendingUser.therapistId) {
            const [therapist] = await db
              .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
              .from(users)
              .where(eq(users.id, pendingUser.therapistId))
              .limit(1);

            if (therapist) {
              therapistName = therapist.name;
              therapistId = therapist.id;
              therapistAvatarUrl = therapist.avatarUrl || undefined;
            }
          }

          await sendPatientInvitationEmail({
            patientEmail: pendingUser.email!,
            patientName: pendingUser.name,
            patientUserId: pendingUser.id,
            therapistName,
            therapistId,
            therapistAvatarUrl,
            setupAccountUrl,
            expiresAt: invitationTokenExpiresAt,
          });
        } else if (pendingUser.role === 'therapist') {
          // Get organization name
          let organizationName = 'your organization';
          if (pendingUser.organizationId) {
            const [org] = await db
              .select({ name: organizationsSchema.name })
              .from(organizationsSchema)
              .where(eq(organizationsSchema.id, pendingUser.organizationId))
              .limit(1);
            if (org) {
              organizationName = org.name;
            }
          }

          // Get inviter name
          let inviterName = 'Admin';
          if (pendingUser.invitedBy) {
            const [inviter] = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, pendingUser.invitedBy))
              .limit(1);
            if (inviter) {
              inviterName = inviter.name;
            }
          }

          await sendTherapistInvitationEmail({
            therapistEmail: pendingUser.email!,
            therapistName: pendingUser.name,
            therapistUserId: pendingUser.id,
            inviterName,
            organizationName,
            setupAccountUrl,
            expiresAt: invitationTokenExpiresAt,
          });
        }
      } catch (emailError) {
        console.error('Failed to send invitation email after approval:', emailError);
        // Don't fail the approval — user is already approved, email can be resent
      }

      // Audit log
      await logAuditFromRequest(request, authUser, 'update', 'user', userId, {
        action: 'approve_invitation',
        userRole: pendingUser.role,
        userName: pendingUser.name,
        userEmail: pendingUser.email,
      });

      return NextResponse.json({
        success: true,
        message: `Invitation approved. An invitation email has been sent to ${pendingUser.email}.`,
      });
    } else {
      // Reject flow
      await db
        .update(users)
        .set({
          status: 'rejected',
          rejectedBy: authUser.dbUserId,
          rejectedAt: new Date(),
          rejectionReason: validated.rejectionReason || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Audit log
      await logAuditFromRequest(request, authUser, 'update', 'user', userId, {
        action: 'reject_invitation',
        userRole: pendingUser.role,
        userName: pendingUser.name,
        userEmail: pendingUser.email,
        rejectionReason: validated.rejectionReason,
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation rejected.',
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to process invitation decision:', error);
    return handleAuthError(error);
  }
}
