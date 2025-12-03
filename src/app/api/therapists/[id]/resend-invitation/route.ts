/**
 * Resend Therapist Invitation API
 * Resend invitation email to a pending therapist
 * HIPAA Compliant: Requires admin authentication
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationsSchema, users } from '@/models/Schema';
import { sendTherapistInvitationEmail } from '@/services/EmailService';
import { handleAuthError, requireAdmin } from '@/utils/AuthHelpers';

/**
 * POST /api/therapists/[id]/resend-invitation - Resend invitation to a therapist
 *
 * Access Control:
 * - Org admins: Can resend invitations to therapists in their organization
 * - Super admins: Can resend invitations to any therapist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // HIPAA: Require admin authentication
    const authUser = await requireAdmin(request);

    const therapistId = params.id;

    // Fetch therapist
    const [therapist] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        firebaseUid: users.firebaseUid,
        organizationId: users.organizationId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, therapistId))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Access control: Org admins can only resend for therapists in their org
    if (authUser.role === 'org_admin') {
      if (!authUser.organizationId || authUser.organizationId !== therapist.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Therapist not in your organization' },
          { status: 403 },
        );
      }
    }

    // Verify therapist is in 'invited' status
    if (therapist.status !== 'invited') {
      return NextResponse.json(
        { error: `Cannot resend invitation. Therapist status is '${therapist.status}' (expected 'invited')` },
        { status: 400 },
      );
    }

    // Verify firebaseUid is null (not yet activated)
    if (therapist.firebaseUid) {
      return NextResponse.json(
        { error: 'Cannot resend invitation. Therapist has already activated their account' },
        { status: 400 },
      );
    }

    // Get organization name
    let organizationName = 'your organization';
    if (therapist.organizationId) {
      const [organization] = await db
        .select({ name: organizationsSchema.name })
        .from(organizationsSchema)
        .where(eq(organizationsSchema.id, therapist.organizationId))
        .limit(1);

      if (organization) {
        organizationName = organization.name;
      }
    }

    // Construct setup account URL
    const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const setupAccountUrl = `${appUrl}/setup-account?email=${encodeURIComponent(therapist.email)}`;

    // Resend invitation email
    try {
      await sendTherapistInvitationEmail({
        therapistEmail: therapist.email,
        therapistName: therapist.name,
        therapistUserId: therapist.id,
        inviterName: authUser.name || 'Admin',
        organizationName,
        setupAccountUrl,
      });

      return NextResponse.json({
        success: true,
        message: `Invitation email resent successfully to ${therapist.email}`,
      });
    } catch (error) {
      console.error('Failed to resend therapist invitation email:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Failed to resend therapist invitation:', error);
    return handleAuthError(error);
  }
}
