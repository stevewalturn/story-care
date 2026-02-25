import type { NextRequest } from 'next/server';
import { and, count, eq, inArray, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { requirePatientAccess } from '@/middleware/RBACMiddleware';
import {
  assessmentSessions,
  groupMembers,
  mediaLibrary,
  musicGenerationTasks,
  notes,
  pageBlocks,
  patientPageInteractions,
  patientReferenceImages,
  quotes,
  reflectionResponses,
  scenes,
  sessions,
  storyPages,
  surveyResponses,
  users,
} from '@/models/Schema';
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
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt), // Exclude soft-deleted patients
      ))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Fetch all group IDs where this patient is a member (for session count)
    const patientGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.patientId, id),
          isNull(groupMembers.leftAt),
        ),
      );
    // Filter out null group IDs
    const patientGroupIds = patientGroups.map(g => g.groupId).filter((gid): gid is string => gid !== null);

    // Fetch all stats counts in parallel
    const [pageCountResult, surveyCountResult, reflectionCountResult, sessionCountResult, notesCountResult, quotesCountResult] = await Promise.all([
      // Count story pages
      db.select({ count: count() })
        .from(storyPages)
        .where(eq(storyPages.patientId, id)),

      // Count survey responses
      db.select({ count: count() })
        .from(surveyResponses)
        .where(eq(surveyResponses.patientId, id)),

      // Count reflection responses
      db.select({ count: count() })
        .from(reflectionResponses)
        .where(eq(reflectionResponses.patientId, id)),

      // Count sessions (individual + group sessions where patient is a member)
      patientGroupIds.length > 0
        ? db.select({ count: count() })
            .from(sessions)
            .where(
              and(
                isNull(sessions.deletedAt),
                or(
                  eq(sessions.patientId, id),
                  inArray(sessions.groupId, patientGroupIds),
                ),
              ),
            )
        : db.select({ count: count() })
            .from(sessions)
            .where(
              and(
                isNull(sessions.deletedAt),
                eq(sessions.patientId, id),
              ),
            ),

      // Count notes for this patient
      db.select({ count: count() })
        .from(notes)
        .where(eq(notes.patientId, id)),

      // Count quotes for this patient
      db.select({ count: count() })
        .from(quotes)
        .where(eq(quotes.patientId, id)),
    ]);

    const pageCount = pageCountResult[0]?.count ?? 0;
    const surveyCount = surveyCountResult[0]?.count ?? 0;
    const reflectionCount = reflectionCountResult[0]?.count ?? 0;
    const sessionCount = sessionCountResult[0]?.count ?? 0;
    const notesCount = notesCountResult[0]?.count ?? 0;
    const quotesCount = quotesCountResult[0]?.count ?? 0;

    // Fetch therapist name if patient has a therapist assigned
    let therapistName: string | null = null;
    if (patient.therapistId) {
      const [therapist] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, patient.therapistId))
        .limit(1);
      therapistName = therapist?.name ?? null;
    }

    // Generate presigned URLs for patient images (HIPAA compliant, 1-hour expiration)
    const patientWithSignedUrls = {
      ...patient,
      referenceImageUrl: patient.referenceImageUrl
        ? await generatePresignedUrl(patient.referenceImageUrl, 1).catch(() => patient.referenceImageUrl)
        : patient.referenceImageUrl,
      avatarUrl: patient.avatarUrl
        ? await generatePresignedUrl(patient.avatarUrl, 1).catch(() => patient.avatarUrl)
        : patient.avatarUrl,
    };

    // Log PHI access
    await logPHIAccess(user.dbUserId, 'user', id, request);

    return NextResponse.json({
      patient: patientWithSignedUrls,
      therapistName,
      pageCount,
      surveyCount,
      reflectionCount,
      sessionCount,
      notesCount,
      quotesCount,
    });
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
    const {
      name,
      email,
      referenceImageUrl,
      avatarUrl,
      therapistId,
      dateOfBirth,
      // Patient demographics
      gender,
      pronouns,
      language,
      notes,
      // Contact information
      phoneNumber,
      // Address information
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      zipCode,
      // Emergency contact
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      emergencyContactEmail,
    } = body;

    // Build update object with only provided fields
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
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth;
    }

    // Patient demographics
    if (gender !== undefined) {
      updateData.gender = gender;
    }
    if (pronouns !== undefined) {
      updateData.pronouns = pronouns;
    }
    if (language !== undefined) {
      updateData.language = language;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Contact information
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
    }

    // Address information
    if (addressLine1 !== undefined) {
      updateData.addressLine1 = addressLine1;
    }
    if (addressLine2 !== undefined) {
      updateData.addressLine2 = addressLine2;
    }
    if (city !== undefined) {
      updateData.city = city;
    }
    if (state !== undefined) {
      updateData.state = state;
    }
    if (country !== undefined) {
      updateData.country = country;
    }
    if (zipCode !== undefined) {
      updateData.zipCode = zipCode;
    }

    // Emergency contact
    if (emergencyContactName !== undefined) {
      updateData.emergencyContactName = emergencyContactName;
    }
    if (emergencyContactRelationship !== undefined) {
      updateData.emergencyContactRelationship = emergencyContactRelationship;
    }
    if (emergencyContactPhone !== undefined) {
      updateData.emergencyContactPhone = emergencyContactPhone;
    }
    if (emergencyContactEmail !== undefined) {
      updateData.emergencyContactEmail = emergencyContactEmail;
    }

    if (therapistId !== undefined) {
      // Validate therapist exists and belongs to the same organization (for org_admin)
      if (therapistId !== null && therapistId !== '') {
        const [therapist] = await db
          .select()
          .from(users)
          .where(eq(users.id, therapistId))
          .limit(1);

        if (!therapist) {
          return NextResponse.json(
            { error: 'Therapist not found' },
            { status: 400 },
          );
        }

        if (therapist.role !== 'therapist') {
          return NextResponse.json(
            { error: 'Selected user is not a therapist' },
            { status: 400 },
          );
        }

        // For org_admin, ensure therapist is in the same organization
        if (user.role === 'org_admin' && therapist.organizationId !== user.organizationId) {
          return NextResponse.json(
            { error: 'Cannot assign patient to therapist from different organization' },
            { status: 403 },
          );
        }
      }
      updateData.therapistId = therapistId || null;
    }

    updateData.updatedAt = new Date();

    const [updatedPatient] = await db
      .update(users)
      .set(updateData)
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt), // Cannot update soft-deleted patients
      ))
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

// DELETE /api/patients/[id] - Delete patient and all associated data
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

    // Check if patient exists and is not already deleted
    const [existingPatient] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.id, id),
        isNull(users.deletedAt),
      ))
      .limit(1);

    if (!existingPatient) {
      return NextResponse.json({ error: 'Patient not found or already deleted' }, { status: 404 });
    }

    const now = new Date();

    // Delete all patient-related data in order (respecting FK constraints)

    // 0. Hard delete assessment sessions (assessment_responses cascade via FK)
    await db.delete(assessmentSessions)
      .where(eq(assessmentSessions.patientId, id));

    // 1. Hard delete patient page interactions (no FK constraints)
    await db.delete(patientPageInteractions)
      .where(eq(patientPageInteractions.patientId, id));

    // 2. Hard delete reflection responses (before story pages)
    await db.delete(reflectionResponses)
      .where(eq(reflectionResponses.patientId, id));

    // 3. Hard delete survey responses (before story pages)
    await db.delete(surveyResponses)
      .where(eq(surveyResponses.patientId, id));

    // 4. Hard delete story pages (pageBlocks, reflectionQuestions, surveyQuestions cascade)
    await db.delete(storyPages)
      .where(eq(storyPages.patientId, id));

    // 4a. Get all scene IDs for this patient
    const patientScenes = await db
      .select({ id: scenes.id })
      .from(scenes)
      .where(eq(scenes.patientId, id));
    const patientSceneIds = patientScenes.map(s => s.id);

    // 4b. NULL out sceneId references in pageBlocks (may belong to other patients' pages)
    if (patientSceneIds.length > 0) {
      await db.update(pageBlocks)
        .set({ sceneId: null })
        .where(inArray(pageBlocks.sceneId, patientSceneIds));
    }

    // 5. Hard delete scenes (sceneClips, sceneAudioTracks cascade)
    await db.delete(scenes)
      .where(eq(scenes.patientId, id));

    // 6. Hard delete music generation tasks
    await db.delete(musicGenerationTasks)
      .where(eq(musicGenerationTasks.patientId, id));

    // 7. Hard delete quotes
    await db.delete(quotes)
      .where(eq(quotes.patientId, id));

    // 8. Hard delete notes
    await db.delete(notes)
      .where(eq(notes.patientId, id));

    // 9. Soft delete media library (has deletedAt)
    await db.update(mediaLibrary)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(mediaLibrary.patientId, id));

    // 10. Soft delete sessions (has deletedAt, transcripts cascade)
    await db.update(sessions)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(sessions.patientId, id));

    // 11. Soft delete patient reference images (has deletedAt)
    await db.update(patientReferenceImages)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(patientReferenceImages.patientId, id));

    // 12. Finally, soft delete the patient user record
    await db
      .update(users)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, id));

    // Log PHI deletion
    const { logPHIDelete } = await import('@/libs/AuditLogger');
    await logPHIDelete(user.dbUserId, 'user', id, request, {
      deletedBy: user.email,
      softDelete: false, // This is now a comprehensive delete
      deletedRelatedData: [
        'assessmentSessions',
        'patientPageInteractions',
        'reflectionResponses',
        'surveyResponses',
        'storyPages',
        'scenes',
        'musicGenerationTasks',
        'quotes',
        'notes',
        'mediaLibrary',
        'sessions',
        'patientReferenceImages',
      ],
    });

    return NextResponse.json({ message: 'Patient and all associated data deleted successfully' });
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
