/**
 * GET /api/media/patients
 * Returns distinct patients that appear in the therapist's media library.
 * Used by the Assets page to populate the patient dropdown with both
 * currently-assigned patients AND patients that have historical media
 * created by this therapist (after reassignment).
 */

import type { NextRequest } from 'next/server';
import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary, users } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Forbidden: Only therapists can use this endpoint' },
        { status: 403 },
      );
    }

    // Fetch distinct patients from media this therapist created
    const rows = await db
      .selectDistinctOn([mediaLibrary.patientId], {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        status: users.status,
      })
      .from(mediaLibrary)
      .innerJoin(users, eq(mediaLibrary.patientId, users.id))
      .where(
        and(
          eq(mediaLibrary.createdByTherapistId, user.dbUserId),
          isNull(mediaLibrary.deletedAt),
          isNotNull(mediaLibrary.patientId),
          isNull(users.deletedAt),
        ),
      );

    return NextResponse.json({ patients: rows });
  } catch (error) {
    console.error('Failed to fetch media patients:', error);
    return handleAuthError(error);
  }
}
