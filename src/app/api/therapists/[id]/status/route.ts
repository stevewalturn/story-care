/**
 * Therapist Status API
 * Change therapist account status (active/inactive)
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { logAuditFromRequest } from '@/services/AuditService';
import { handleAuthError, requireAdmin } from '@/utils/AuthHelpers';
import { updateTherapistStatusSchema } from '@/validations/UserValidation';

/**
 * PATCH /api/therapists/[id]/status - Change therapist status
 *
 * Access Control:
 * - Org admins: Can only modify therapists in their organization
 * - Super admins: Can modify therapists across all organizations
 *
 * Constraints:
 * - Cannot change status of 'invited' users (they must complete setup first)
 * - Valid status values: 'active', 'inactive'
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);
    const { id } = await params;

    // Fetch therapist
    const therapist = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Ensure user is a therapist
    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Check if already deleted
    if (therapist.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot modify status of a deleted therapist' },
        { status: 400 },
      );
    }

    // Cannot change status of invited users
    if (therapist.status === 'invited') {
      return NextResponse.json(
        { error: 'Cannot change status of an invited user. They must complete their account setup first.' },
        { status: 400 },
      );
    }

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      if (therapist.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot modify therapists outside your organization' },
          { status: 403 },
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateTherapistStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    const { status: newStatus } = validationResult.data;
    const previousStatus = therapist.status;

    // No change needed
    if (newStatus === previousStatus) {
      return NextResponse.json({
        message: `Therapist is already ${newStatus}`,
        therapist: {
          id: therapist.id,
          name: therapist.name,
          email: therapist.email,
          status: therapist.status,
        },
      });
    }

    // Update therapist status
    const [updatedTherapist] = await db
      .update(users)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        role: users.role,
        organizationId: users.organizationId,
        licenseNumber: users.licenseNumber,
        specialty: users.specialty,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt,
      });

    // HIPAA: Audit log the status change
    await logAuditFromRequest(request, authUser, 'update', 'user', id, {
      statusChange: {
        from: previousStatus,
        to: newStatus,
      },
      therapistEmail: therapist.email,
      therapistName: therapist.name,
    });

    const actionVerb = newStatus === 'active' ? 'activated' : 'deactivated';

    return NextResponse.json({
      message: `Therapist ${actionVerb} successfully`,
      therapist: updatedTherapist,
    });
  } catch (error) {
    console.error('Failed to update therapist status:', error);
    return handleAuthError(error);
  }
}
