import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteReferenceImage,
  setPrimaryReferenceImage,
  updateReferenceImageLabel,
} from '@/services/PatientReferenceImageService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// PATCH /api/patients/[id]/reference-images/[imageId] - Update reference image
// Supports: setting as primary, updating label
// HIPAA COMPLIANCE: Requires authentication and audit logging
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    // 1. AUTHENTICATION: Verify user is a therapist or admin
    await requireTherapist(request);

    // 2. GET PARAMS
    const { id: patientId, imageId } = await params;

    // 3. PARSE REQUEST BODY
    const body = await request.json();
    const schema = z.object({
      action: z.enum(['set_primary', 'update_label']),
      label: z.string().optional(),
    });

    const validated = schema.parse(body);

    let updatedImage;

    if (validated.action === 'set_primary') {
      // Set this image as primary
      updatedImage = await setPrimaryReferenceImage(imageId, patientId);
    } else if (validated.action === 'update_label') {
      if (!validated.label) {
        return NextResponse.json(
          { error: 'Label is required for update_label action' },
          { status: 400 },
        );
      }

      // Update image label
      updatedImage = await updateReferenceImageLabel(imageId, patientId, validated.label);
    }

    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    console.error('Error updating reference image:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleAuthError(error);
  }
}

// DELETE /api/patients/[id]/reference-images/[imageId] - Soft delete reference image
// HIPAA COMPLIANCE: Requires authentication and audit logging
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    // 1. AUTHENTICATION: Verify user is a therapist or admin
    await requireTherapist(request);

    // 2. GET PARAMS
    const { id: patientId, imageId } = await params;

    // 3. DELETE REFERENCE IMAGE (soft delete)
    await deleteReferenceImage(imageId, patientId);

    return NextResponse.json({ success: true, message: 'Reference image deleted' });
  } catch (error) {
    console.error('Error deleting reference image:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return handleAuthError(error);
  }
}
