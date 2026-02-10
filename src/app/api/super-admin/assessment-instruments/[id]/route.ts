/**
 * API Route: Super Admin Assessment Instrument by ID
 * GET: Get instrument with items
 * PATCH: Update instrument status
 * DELETE: Delete instrument (only if no sessions)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteInstrument, getInstrument, updateInstrument, updateInstrumentStatus } from '@/services/AssessmentService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';
import { updateInstrumentSchema, updateInstrumentStatusSchema } from '@/validations/AssessmentValidation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ['super_admin']);
    const { id } = await params;

    const instrument = await getInstrument(id);
    if (!instrument) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    return NextResponse.json({ instrument });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching instrument:', error);
    return NextResponse.json({ error: 'Failed to fetch instrument' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(request, ['super_admin']);
    const { id } = await params;

    const body = await request.json();

    // Try status-only update first (backwards compatible)
    const statusOnly = updateInstrumentStatusSchema.safeParse(body);
    if (statusOnly.success && Object.keys(body).length === 1) {
      const updated = await updateInstrumentStatus(id, statusOnly.data.status);
      if (!updated) {
        return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
      }

      const { logPHIUpdate } = await import('@/libs/AuditLogger');
      await logPHIUpdate(user.dbUserId, 'assessment_instrument', id, request, {
        changedFields: ['status'],
      });

      return NextResponse.json({ instrument: updated });
    }

    // Full instrument update
    const validation = updateInstrumentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const updated = await updateInstrument(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    const { logPHIUpdate } = await import('@/libs/AuditLogger');
    const changedFields = Object.keys(validation.data).filter(k => validation.data[k as keyof typeof validation.data] !== undefined);
    await logPHIUpdate(user.dbUserId, 'assessment_instrument', id, request, {
      changedFields,
    });

    return NextResponse.json({ instrument: updated });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error updating instrument:', error);
    return NextResponse.json({ error: 'Failed to update instrument' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(request, ['super_admin']);
    const { id } = await params;

    const deleted = await deleteInstrument(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    const { logPHIDelete } = await import('@/libs/AuditLogger');
    await logPHIDelete(user.dbUserId, 'assessment_instrument', id, request);

    return NextResponse.json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot delete instrument')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error deleting instrument:', error);
    return NextResponse.json({ error: 'Failed to delete instrument' }, { status: 500 });
  }
}
