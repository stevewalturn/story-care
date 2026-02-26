/**
 * Assign Patients to Therapist API
 * Allows org admin to assign/reassign patients to a therapist
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { therapistPatientArchives, users } from '@/models/Schema';
import { logAuditFromRequest } from '@/services/AuditService';
import { handleAuthError, requireAdmin } from '@/utils/AuthHelpers';

const assignPatientsSchema = z.object({
  patientIds: z.array(z.string().uuid()).min(1, 'At least one patient must be selected'),
});

/**
 * POST /api/therapists/[id]/assign-patients - Assign patients to therapist
 *
 * Access Control:
 * - Org admins: Can only assign patients in their organization to therapists in their organization
 * - Super admins: Can assign any patients to any therapists
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);
    const { id: therapistId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validated = assignPatientsSchema.parse(body);

    // Fetch therapist
    const therapist = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, therapistId),
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Ensure therapist is actually a therapist role
    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Organization boundary enforcement for org admins
    if (authUser.role === 'org_admin') {
      // Org admins can only assign patients to therapists in their organization
      if (therapist.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot assign patients to therapists outside your organization' },
          { status: 403 },
        );
      }
    }

    // Fetch patients to be assigned
    const patients = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, validated.patientIds),
    });

    if (patients.length !== validated.patientIds.length) {
      return NextResponse.json(
        { error: 'One or more patients not found' },
        { status: 404 },
      );
    }

    // Verify all patients are actually patients
    const invalidPatients = patients.filter(p => p.role !== 'patient');
    if (invalidPatients.length > 0) {
      return NextResponse.json(
        { error: 'One or more selected users are not patients' },
        { status: 400 },
      );
    }

    // Organization boundary enforcement for org admins
    if (authUser.role === 'org_admin') {
      // Org admins can only assign patients in their organization
      const outsideOrgPatients = patients.filter(
        p => p.organizationId !== authUser.organizationId,
      );

      if (outsideOrgPatients.length > 0) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot assign patients outside your organization' },
          { status: 403 },
        );
      }
    }

    // BUG-16B: Remove stale archive entries for all reassigned patients so their
    // new therapist sees them in the active list by default.
    await db.delete(therapistPatientArchives)
      .where(inArray(therapistPatientArchives.patientId, validated.patientIds));

    // BUG-14 note: Concurrent assignment of the same patients by two admins
    // simultaneously results in a last-write-wins race. A SELECT FOR UPDATE
    // transaction would fully prevent this; deferred given admin-only access.
    // Assign patients to therapist (update therapistId)
    await db
      .update(users)
      .set({
        therapistId,
        updatedAt: new Date(),
      })
      .where(inArray(users.id, validated.patientIds));

    // BUG-03: Audit log the bulk assignment (previously missing entirely).
    await logAuditFromRequest(request, authUser, 'update', 'user', therapistId, {
      action: 'bulk_patient_assignment',
      assignedPatientIds: validated.patientIds,
      assignedCount: validated.patientIds.length,
      therapistName: therapist.name,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${validated.patientIds.length} patient(s) to ${therapist.name}`,
      assignedCount: validated.patientIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 },
      );
    }
    console.error('Failed to assign patients:', error);
    return handleAuthError(error);
  }
}
