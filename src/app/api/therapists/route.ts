/**
 * Therapists API
 * Manage therapist accounts within an organization
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { and, count, eq, ilike, isNull, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { organizationsSchema, users } from '@/models/Schema';
import { sendTherapistInvitationEmail } from '@/services/EmailService';
import { handleAuthError, requireAdmin, requireAuth } from '@/utils/AuthHelpers';
import { calculateExpirationDate, generateInvitationToken } from '@/utils/InvitationTokens';
import { inviteTherapistSchema } from '@/validations/UserValidation';

/**
 * GET /api/therapists - List therapists in the authenticated user's organization
 *
 * Query Parameters:
 * - search: Filter by name (optional)
 *
 * Access Control:
 * - Org admins: See all therapists in their organization
 * - Super admins: See all therapists across all organizations
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query conditions
    // Exclude deleted therapists - check both status AND deletedAt for consistency
    const conditions = [
      eq(users.role, 'therapist'),
      ne(users.status, 'deleted'),
      isNull(users.deletedAt),
    ];

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      // Org admins can only see therapists in their organization
      if (!authUser.organizationId) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 },
        );
      }
      conditions.push(eq(users.organizationId, authUser.organizationId));
    } else if (authUser.role === 'therapist' || authUser.role === 'patient') {
      // Therapists and patients shouldn't access this endpoint
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 },
      );
    }
    // Super admins can see all therapists (no org filter)

    // Search filter
    if (search) {
      conditions.push(ilike(users.name, `%${search}%`));
    }

    // Fetch therapists
    const therapists = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.name);

    // Get patient count for each therapist
    const therapistsWithCounts = await Promise.all(
      therapists.map(async (therapist) => {
        const patientCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.role, 'patient'),
              eq(users.therapistId, therapist.id),
              isNull(users.deletedAt),
            ),
          );

        return {
          ...therapist,
          patientCount: Number(patientCountResult[0]?.count || 0),
        };
      }),
    );

    return NextResponse.json({
      therapists: therapistsWithCounts,
      total: therapistsWithCounts.length,
    });
  } catch (error) {
    console.error('Failed to fetch therapists:', error);
    return handleAuthError(error);
  }
}

/**
 * POST /api/therapists - Invite a therapist to the organization
 *
 * Request Body:
 * - name: Therapist name (required)
 * - email: Therapist email (required)
 * - licenseNumber: Professional license number (optional)
 * - specialty: Therapist specialty (optional)
 *
 * Access Control:
 * - Org admins: Can invite therapists to their organization
 * - Super admins: Can invite therapists to any organization
 *
 * Flow:
 * 1. Creates therapist with status='invited', firebaseUid=null
 * 2. Therapist receives invitation (email integration pending)
 * 3. When therapist signs in, firebaseUid is linked and status becomes 'active'
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);

    const body = await request.json();
    const validated = inviteTherapistSchema.parse(body);

    // Check if email already exists in the organization
    const existingUser = await db.query.users.findFirst({
      where: (users, { and, eq }) => {
        const conditions = [eq(users.email, validated.email)];

        // For org admins, check within their organization only
        if (authUser.role === 'org_admin' && authUser.organizationId) {
          conditions.push(eq(users.organizationId, authUser.organizationId));
        }

        return and(...conditions);
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: authUser.role === 'org_admin'
            ? 'A user with this email already exists in your organization'
            : 'A user with this email already exists',
        },
        { status: 409 },
      );
    }

    // Org admins must have an organization
    if (authUser.role === 'org_admin' && !authUser.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 },
      );
    }

    // Determine if approval is needed (non-super-admin invitations require approval)
    const requiresApproval = authUser.role !== 'super_admin';
    const therapistStatus = requiresApproval ? 'pending_approval' : 'invited';

    // Only generate token if sending invitation immediately (super admin bypass)
    const invitationToken = requiresApproval ? null : generateInvitationToken();
    const invitationTokenExpiresAt = requiresApproval ? null : calculateExpirationDate(7); // 7 days expiry

    // Create therapist
    const therapistResult = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        licenseNumber: validated.licenseNumber || null,
        specialty: validated.specialty || null,
        role: 'therapist',
        organizationId: authUser.organizationId, // null for super_admin is OK
        status: therapistStatus,
        firebaseUid: null, // Will be linked when they sign in
        invitationToken,
        invitationTokenExpiresAt,
        invitationSentAt: requiresApproval ? null : new Date(),
        invitedBy: authUser.dbUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const therapist = Array.isArray(therapistResult) ? therapistResult[0] : undefined;

    if (!therapist) {
      return NextResponse.json(
        { error: 'Failed to create therapist' },
        { status: 500 },
      );
    }

    // If pending approval, return early without sending email
    if (requiresApproval) {
      return NextResponse.json(
        {
          therapist,
          emailSent: false,
          message: 'Therapist created and is pending administrator approval. The invitation email will be sent once approved.',
        },
        { status: 201 },
      );
    }

    // Send invitation email (super admin bypass)
    let emailSent = false;
    let emailError: string | null = null;

    try {
      // Get organization name
      let organizationName = 'your organization';
      if (authUser.organizationId) {
        const [organization] = await db
          .select({ name: organizationsSchema.name })
          .from(organizationsSchema)
          .where(eq(organizationsSchema.id, authUser.organizationId))
          .limit(1);

        if (organization) {
          organizationName = organization.name;
        }
      }

      // Construct setup account URL with token
      const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const setupAccountUrl = `${appUrl}/setup-account?token=${invitationToken}`;

      // Send invitation email
      await sendTherapistInvitationEmail({
        therapistEmail: therapist.email,
        therapistName: therapist.name,
        therapistUserId: therapist.id,
        inviterName: authUser.name || 'Admin', // Use actual inviter name
        organizationName,
        setupAccountUrl,
        expiresAt: invitationTokenExpiresAt || undefined,
      });

      emailSent = true;
    } catch (error) {
      // Log error but don't fail the request (therapist already created)
      console.error('Failed to send therapist invitation email:', error);
      emailError = error instanceof Error ? error.message : 'Failed to send email';
    }

    return NextResponse.json(
      {
        therapist,
        emailSent,
        message: emailSent
          ? `Therapist invited successfully! An invitation email has been sent to ${therapist.email}`
          : `Therapist created but invitation email failed: ${emailError}. They can still set up their account at /setup-account`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to invite therapist:', error);
    return handleAuthError(error);
  }
}
