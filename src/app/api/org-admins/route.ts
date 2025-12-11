/**
 * Org Admins API
 * Manage organization administrator accounts
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
import { inviteOrgAdminSchema } from '@/validations/UserValidation';

/**
 * POST /api/org-admins - Invite an org admin to the platform
 *
 * Request Body:
 * - name: Org admin name (required)
 * - email: Org admin email (required)
 * - organizationId: Organization UUID (required)
 *
 * Access Control:
 * - Super admins only: Can invite org admins to any organization
 *
 * Flow:
 * 1. Creates org admin with status='invited', firebaseUid=null
 * 2. Org admin receives invitation email
 * 3. When org admin signs in, firebaseUid is linked and status becomes 'active'
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require super admin authentication
    const authUser = await requireAuth(request);

    // Only super admins can invite org admins
    if (authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can invite organization administrators' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = inviteOrgAdminSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validated.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      );
    }

    // Verify organization exists
    const [organization] = await db
      .select({ id: organizationsSchema.id, name: organizationsSchema.name })
      .from(organizationsSchema)
      .where(eq(organizationsSchema.id, validated.organizationId))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // Create invited org admin
    const orgAdminResult = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        role: 'org_admin',
        organizationId: validated.organizationId,
        status: 'invited', // Will be activated when they sign in
        firebaseUid: null, // Will be linked when they sign in
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const orgAdmin = Array.isArray(orgAdminResult) ? orgAdminResult[0] : undefined;

    if (!orgAdmin) {
      return NextResponse.json(
        { error: 'Failed to create organization administrator' },
        { status: 500 },
      );
    }

    // Send invitation email
    let emailSent = false;
    let emailError: string | null = null;

    try {
      // Construct setup account URL
      const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const setupAccountUrl = `${appUrl}/setup-account?email=${encodeURIComponent(validated.email)}&type=org_admin`;

      // Send invitation email
      await sendOrgAdminInvitationEmail({
        orgAdminEmail: orgAdmin.email,
        orgAdminName: orgAdmin.name,
        orgAdminUserId: orgAdmin.id,
        inviterName: authUser.name || 'Super Admin', // Use actual inviter name
        organizationName: organization.name,
        setupAccountUrl,
      });

      emailSent = true;
    } catch (error) {
      // Log error but don't fail the request (org admin already created)
      console.error('Failed to send org admin invitation email:', error);
      emailError = error instanceof Error ? error.message : 'Failed to send email';
    }

    return NextResponse.json(
      {
        orgAdmin,
        emailSent,
        message: emailSent
          ? `Organization administrator invited successfully! An invitation email has been sent to ${orgAdmin.email}`
          : `Organization administrator created but invitation email failed: ${emailError}. They can still set up their account at /setup-account`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to invite organization administrator:', error);
    return handleAuthError(error);
  }
}
