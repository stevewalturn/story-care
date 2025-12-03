/**
 * Resend Org Admin Invitation API
 * Resend invitation email to a pending organization administrator
 * HIPAA Compliant: Requires super admin authentication
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationsSchema, users } from '@/models/Schema';
import { sendOrgAdminInvitationEmail } from '@/services/EmailService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * POST /api/org-admins/[id]/resend-invitation - Resend invitation to an org admin
 *
 * Access Control:
 * - Super admins only: Can resend invitations to any org admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // HIPAA: Require super admin authentication
    const authUser = await requireAuth(request);

    // Only super admins can resend org admin invitations
    if (authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can resend organization administrator invitations' },
        { status: 403 },
      );
    }

    const orgAdminId = params.id;

    // Fetch org admin
    const [orgAdmin] = await db
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
      .where(eq(users.id, orgAdminId))
      .limit(1);

    if (!orgAdmin) {
      return NextResponse.json(
        { error: 'Organization administrator not found' },
        { status: 404 },
      );
    }

    if (orgAdmin.role !== 'org_admin') {
      return NextResponse.json(
        { error: 'User is not an organization administrator' },
        { status: 400 },
      );
    }

    // Verify org admin is in 'invited' status
    if (orgAdmin.status !== 'invited') {
      return NextResponse.json(
        { error: `Cannot resend invitation. Organization administrator status is '${orgAdmin.status}' (expected 'invited')` },
        { status: 400 },
      );
    }

    // Verify firebaseUid is null (not yet activated)
    if (orgAdmin.firebaseUid) {
      return NextResponse.json(
        { error: 'Cannot resend invitation. Organization administrator has already activated their account' },
        { status: 400 },
      );
    }

    // Verify organization exists
    if (!orgAdmin.organizationId) {
      return NextResponse.json(
        { error: 'Organization administrator has no assigned organization' },
        { status: 400 },
      );
    }

    const [organization] = await db
      .select({ id: organizationsSchema.id, name: organizationsSchema.name })
      .from(organizationsSchema)
      .where(eq(organizationsSchema.id, orgAdmin.organizationId))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // Construct setup account URL
    const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const setupAccountUrl = `${appUrl}/setup-account?email=${encodeURIComponent(orgAdmin.email)}&type=org_admin`;

    // Resend invitation email
    try {
      await sendOrgAdminInvitationEmail({
        orgAdminEmail: orgAdmin.email,
        orgAdminName: orgAdmin.name,
        orgAdminUserId: orgAdmin.id,
        inviterName: authUser.name || 'Super Admin',
        organizationName: organization.name,
        setupAccountUrl,
      });

      return NextResponse.json({
        success: true,
        message: `Invitation email resent successfully to ${orgAdmin.email}`,
      });
    } catch (error) {
      console.error('Failed to resend org admin invitation email:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Failed to resend org admin invitation:', error);
    return handleAuthError(error);
  }
}
