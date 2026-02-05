/**
 * Patient Archive API
 * Per-therapist patient visibility management
 * Allows therapists to hide patients from their personal list without affecting other users
 */

import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { requirePatientAccess } from '@/middleware/RBACMiddleware';
import { therapistPatientArchives, users } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

/**
 * POST /api/patients/[id]/archive - Archive patient for current therapist
 *
 * Adds patient to therapist's archived list (per-user visibility).
 * Does NOT delete patient data or affect other users.
 *
 * Access Control:
 * - Only therapists can archive patients
 * - Therapist must own the patient
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: patientId } = await params;

    // Verify user has access to this patient
    const user = await requirePatientAccess(request, patientId);

    // Only therapists can archive patients from their personal list
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Forbidden: Only therapists can archive patients from their list' },
        { status: 403 },
      );
    }

    // Verify patient exists and belongs to this therapist
    const [patient] = await db
      .select({ id: users.id, therapistId: users.therapistId })
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 },
      );
    }

    if (patient.therapistId !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot archive patients not assigned to you' },
        { status: 403 },
      );
    }

    // Upsert archive record (on conflict do nothing)
    await db
      .insert(therapistPatientArchives)
      .values({
        therapistId: user.dbUserId,
        patientId,
        archivedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [therapistPatientArchives.therapistId, therapistPatientArchives.patientId],
        set: {
          archivedAt: new Date(),
        },
      });

    // Log audit trail
    await logPHIUpdate(user.dbUserId, 'user', patientId, request, {
      action: 'archive',
      note: 'Patient archived from therapist personal list',
    });

    return NextResponse.json({
      success: true,
      message: 'Patient archived from your list',
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error archiving patient:', error);
    return NextResponse.json(
      { error: 'Failed to archive patient' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/patients/[id]/archive - Unarchive patient for current therapist
 *
 * Removes patient from therapist's archived list (restores visibility).
 *
 * Access Control:
 * - Only therapists can unarchive patients
 * - Therapist must own the patient
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: patientId } = await params;

    // Verify user has access to this patient
    const user = await requirePatientAccess(request, patientId);

    // Only therapists can unarchive patients
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Forbidden: Only therapists can unarchive patients' },
        { status: 403 },
      );
    }

    // Delete archive record
    const result = await db
      .delete(therapistPatientArchives)
      .where(
        and(
          eq(therapistPatientArchives.therapistId, user.dbUserId),
          eq(therapistPatientArchives.patientId, patientId),
        ),
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Patient was not archived' },
        { status: 404 },
      );
    }

    // Log audit trail
    await logPHIUpdate(user.dbUserId, 'user', patientId, request, {
      action: 'unarchive',
      note: 'Patient restored to therapist personal list',
    });

    return NextResponse.json({
      success: true,
      message: 'Patient restored to your list',
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error unarchiving patient:', error);
    return NextResponse.json(
      { error: 'Failed to unarchive patient' },
      { status: 500 },
    );
  }
}
