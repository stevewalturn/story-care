import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { requirePatientAccess } from '@/middleware/RBACMiddleware';
import { users } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

// GET /api/patients/[id] - Get a single patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this patient
    const user = await requirePatientAccess(request, id);

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Log PHI access
    await logPHIAccess(user.dbUserId, 'user', id, request);

    return NextResponse.json({ patient });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 },
    );
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this patient (only therapist/admin can update)
    const user = await requirePatientAccess(request, id);

    const body = await request.json();
    const { name, email, referenceImageUrl, avatarUrl } = body;

    // Build update object with only provided fields that exist in schema
    // Note: phone and notes fields don't exist in the users table
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (referenceImageUrl !== undefined) {
      updateData.referenceImageUrl = referenceImageUrl;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    updateData.updatedAt = new Date();

    const [updatedPatient] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Log PHI modification
    const { logPHIUpdate } = await import('@/libs/AuditLogger');
    await logPHIUpdate(user.dbUserId, 'user', id, request, {
      changedFields: Object.keys(updateData),
    });

    return NextResponse.json({ patient: updatedPatient });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 },
    );
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this patient (only therapist/org_admin/super_admin can delete)
    const user = await requirePatientAccess(request, id);

    // Only org_admin or super_admin can delete patients
    if (user.role !== 'org_admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only organization admins can delete patients' },
        { status: 403 },
      );
    }

    const deletedPatient = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedPatient || !Array.isArray(deletedPatient) || deletedPatient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Log PHI deletion
    const { logPHIDelete } = await import('@/libs/AuditLogger');
    await logPHIDelete(user.dbUserId, 'user', id, request, {
      deletedBy: user.email,
    });

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 },
    );
  }
}
