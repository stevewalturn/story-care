/**
 * Patients API
 * Manage patient accounts within an organization
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { and, count, desc, eq, ilike, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { generatePresignedUrl, generatePresignedUrlsForPatients } from '@/libs/GCS';
import {
  groupMembers as groupMembersSchema,
  patientReferenceImagesSchema,
  reflectionResponses as reflectionResponsesSchema,
  sessions as sessionsSchema,
  storyPages as storyPagesSchema,
  surveyResponses as surveyResponsesSchema,
  therapistPatientArchives,
  users,
} from '@/models/Schema';
import { sendPatientInvitationEmail } from '@/services/EmailService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { calculateExpirationDate, generateInvitationToken } from '@/utils/InvitationTokens';
import { invitePatientSchema } from '@/validations/UserValidation';

/**
 * GET /api/patients - List patients in the authenticated user's organization
 *
 * Query Parameters:
 * - search: Filter by name (optional)
 * - therapistId: Filter by therapist Firebase UID (optional)
 * - view: 'active' | 'archived' - Filter by archive status (therapists only, default: 'active')
 *
 * Access Control:
 * - Org admins: See all patients in their organization
 * - Therapists: See only their assigned patients (with archive filtering)
 * - Super admins: See all patients across all organizations
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistFirebaseUid = searchParams.get('therapistId');
    const view = searchParams.get('view') || 'active'; // 'active' | 'archived'

    // Build query conditions
    const conditions = [
      eq(users.role, 'patient'),
      isNull(users.deletedAt), // Exclude soft-deleted patients
    ];

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      // Org admins can only see patients in their organization
      if (!authUser.organizationId) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 },
        );
      }
      conditions.push(eq(users.organizationId, authUser.organizationId));
    } else if (authUser.role === 'therapist') {
      // Therapists can only see their assigned patients
      conditions.push(eq(users.therapistId, authUser.dbUserId));

      // Archive filtering for therapists only
      // Get list of archived patient IDs for this therapist
      const archivedPatientIds = await db
        .select({ patientId: therapistPatientArchives.patientId })
        .from(therapistPatientArchives)
        .where(eq(therapistPatientArchives.therapistId, authUser.dbUserId));

      const archivedIds = archivedPatientIds.map(row => row.patientId);

      if (view === 'active') {
        // Show only non-archived patients
        if (archivedIds.length > 0) {
          conditions.push(notInArray(users.id, archivedIds));
        }
      } else if (view === 'archived') {
        // Show only archived patients
        if (archivedIds.length === 0) {
          // No archived patients - return empty list
          return NextResponse.json({ patients: [] });
        }
        conditions.push(inArray(users.id, archivedIds));
      }

      // If therapist also filters by therapistId, ensure it's their own ID
      if (therapistFirebaseUid && therapistFirebaseUid !== authUser.uid) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access other therapists\' patients' },
          { status: 403 },
        );
      }
    } else if (authUser.role === 'patient') {
      // Patients shouldn't access this endpoint
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 },
      );
    }
    // Super admins can see all patients (no org filter)

    // Search filter
    if (search) {
      conditions.push(ilike(users.name, `%${search}%`));
    }

    // Therapist filter (for org admins filtering by specific therapist)
    if (therapistFirebaseUid && authUser.role === 'org_admin') {
      const [therapist] = await db
        .select({ id: users.id, organizationId: users.organizationId })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (therapist) {
        // Ensure therapist is in the same organization
        if (therapist.organizationId !== authUser.organizationId) {
          return NextResponse.json(
            { error: 'Forbidden: Therapist not in your organization' },
            { status: 403 },
          );
        }
        conditions.push(eq(users.therapistId, therapist.id));
      } else {
        // Therapist not found, return empty array
        return NextResponse.json({ patients: [] });
      }
    }

    // Fetch patients
    const patientsList = await db
      .select()
      .from(users)
      .where(and(...conditions));

    // Generate presigned URLs for patient images (HIPAA compliant, 1-hour expiration)
    const patientsWithSignedUrls = await generatePresignedUrlsForPatients(patientsList, 1);

    // Fetch reference images and counts for each patient
    const patientsWithReferenceImagesAndCounts = await Promise.all(
      patientsWithSignedUrls.map(async (patient) => {
        // Fetch reference images
        const referenceImages = await db
          .select()
          .from(patientReferenceImagesSchema)
          .where(
            and(
              eq(patientReferenceImagesSchema.patientId, patient.id),
              isNull(patientReferenceImagesSchema.deletedAt),
            ),
          )
          .orderBy(
            desc(patientReferenceImagesSchema.isPrimary),
            desc(patientReferenceImagesSchema.createdAt),
          )
          .limit(4); // Only fetch first 4 for display

        // Generate presigned URLs for each reference image (1-hour expiration for HIPAA)
        const referenceImagesWithSignedUrls = await Promise.all(
          referenceImages.map(async (refImg) => {
            const signedImageUrl = await generatePresignedUrl(refImg.imageUrl, 1);
            return {
              ...refImg,
              imageUrl: signedImageUrl || refImg.imageUrl,
            };
          }),
        );

        // Calculate counts for this patient
        // First get patient's group IDs (for group session counting)
        const patientGroups = await db
          .select({ groupId: groupMembersSchema.groupId })
          .from(groupMembersSchema)
          .where(
            and(
              eq(groupMembersSchema.patientId, patient.id),
              isNull(groupMembersSchema.leftAt),
            ),
          );
        const patientGroupIds = patientGroups.map(g => g.groupId).filter((gid): gid is string => gid !== null);

        // Count sessions (individual + group sessions where patient is a member)
        const [sessionCountResult] = patientGroupIds.length > 0
          ? await db
              .select({ count: count() })
              .from(sessionsSchema)
              .where(
                and(
                  isNull(sessionsSchema.deletedAt),
                  or(
                    eq(sessionsSchema.patientId, patient.id),
                    inArray(sessionsSchema.groupId, patientGroupIds),
                  ),
                ),
              )
          : await db
              .select({ count: count() })
              .from(sessionsSchema)
              .where(
                and(
                  isNull(sessionsSchema.deletedAt),
                  eq(sessionsSchema.patientId, patient.id),
                ),
              );

        const [pageCountResult] = await db
          .select({ count: count() })
          .from(storyPagesSchema)
          .where(eq(storyPagesSchema.patientId, patient.id));

        const [surveyCountResult] = await db
          .select({ count: count() })
          .from(surveyResponsesSchema)
          .where(eq(surveyResponsesSchema.patientId, patient.id));

        const [reflectionCountResult] = await db
          .select({ count: count() })
          .from(reflectionResponsesSchema)
          .where(eq(reflectionResponsesSchema.patientId, patient.id));

        return {
          ...patient,
          referenceImages: referenceImagesWithSignedUrls,
          sessionCount: sessionCountResult?.count || 0,
          pageCount: pageCountResult?.count || 0,
          surveyCount: surveyCountResult?.count || 0,
          reflectionCount: reflectionCountResult?.count || 0,
        };
      }),
    );

    return NextResponse.json({ patients: patientsWithReferenceImagesAndCounts });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return handleAuthError(error);
  }
}

/**
 * POST /api/patients - Create/Invite a new patient
 *
 * Request Body:
 * - name: Patient name (required)
 * - email: Patient email (required for invitation, optional otherwise)
 * - dateOfBirth: Patient date of birth (optional)
 * - referenceImageUrl: Patient avatar/reference image (optional)
 * - therapistId: Therapist database ID (UUID) (required)
 * - welcomeMessage: Personal message from therapist (optional)
 * - sendInvitation: Whether to send invitation email (default: true if email provided)
 *
 * Access Control:
 * - Therapists: Can create patients assigned to themselves
 * - Org admins: Can create patients assigned to any therapist in their org
 * - Super admins: Can create patients in any organization
 *
 * Flow:
 * 1. If email provided and sendInvitation=true: Creates with status='invited', sends email
 * 2. Otherwise: Creates with status='active' (no invitation needed)
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const body = await request.json();
    const validated = invitePatientSchema.parse(body);

    // Fetch therapist to get database UUID, organizationId, and details
    const [therapist] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        organizationId: users.organizationId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.firebaseUid, validated.therapistId))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Access control: Ensure user can create patients for this therapist
    if (authUser.role === 'therapist') {
      // Therapists can only create patients for themselves
      if (authUser.dbUserId !== therapist.id) {
        return NextResponse.json(
          { error: 'Forbidden: Can only create patients assigned to yourself' },
          { status: 403 },
        );
      }
    } else if (authUser.role === 'org_admin') {
      // Org admins can only create patients for therapists in their org
      if (authUser.organizationId !== therapist.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Therapist not in your organization' },
          { status: 403 },
        );
      }
    }
    // Super admins can create patients for any therapist

    // Check if email already exists (if email provided)
    if (validated.email) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, validated.email),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 },
        );
      }
    }

    // Determine status and whether approval is needed
    const shouldSendInvitation = validated.email && validated.sendInvitation;
    const requiresApproval = shouldSendInvitation && authUser.role !== 'super_admin';

    // If approval required: pending_approval (no token, no email)
    // If super admin sending invitation: invited (token + email immediately)
    // If no invitation: active
    const patientStatus = requiresApproval
      ? 'pending_approval'
      : shouldSendInvitation ? 'invited' : 'active';

    // Only generate token if sending invitation immediately (super admin bypass)
    const invitationToken = (shouldSendInvitation && !requiresApproval) ? generateInvitationToken() : null;
    const invitationTokenExpiresAt = (shouldSendInvitation && !requiresApproval) ? calculateExpirationDate(7) : null;

    // Create patient - IMPORTANT: Inherit organizationId from therapist
    const patientResult = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email || null,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        referenceImageUrl: validated.referenceImageUrl || null,
        avatarUrl: validated.avatarUrl || null,
        role: 'patient',
        therapistId: therapist.id, // Link to therapist (database UUID)
        organizationId: therapist.organizationId, // Inherit organization from therapist
        status: patientStatus,
        firebaseUid: shouldSendInvitation ? null : undefined, // null for invited, undefined for active
        invitationToken,
        invitationTokenExpiresAt,
        invitationSentAt: (shouldSendInvitation && !requiresApproval) ? new Date() : null,
        invitedBy: authUser.dbUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const patient = Array.isArray(patientResult) && patientResult.length > 0 ? patientResult[0] : null;

    if (!patient) {
      return NextResponse.json(
        { error: 'Failed to create patient' },
        { status: 500 },
      );
    }

    // If pending approval, return early without sending email
    if (requiresApproval) {
      return NextResponse.json(
        {
          patient,
          emailSent: false,
          message: 'Patient created and is pending administrator approval. The invitation email will be sent once approved.',
        },
        { status: 201 },
      );
    }

    // Send invitation email if requested (super admin bypass or no approval needed)
    let emailSent = false;
    let emailError: string | null = null;

    if (shouldSendInvitation && validated.email && invitationToken) {
      try {
        // Construct setup account URL with token
        const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const setupAccountUrl = `${appUrl}/setup-account?token=${invitationToken}`;

        // Send invitation email
        await sendPatientInvitationEmail({
          patientEmail: validated.email,
          patientName: patient.name,
          patientUserId: patient.id,
          therapistName: therapist.name,
          therapistId: therapist.id,
          therapistAvatarUrl: therapist.avatarUrl || undefined,
          setupAccountUrl,
          welcomeMessage: validated.welcomeMessage,
          expiresAt: invitationTokenExpiresAt || undefined,
        });

        emailSent = true;
      } catch (error) {
        // Log error but don't fail the request (patient already created)
        console.error('Failed to send patient invitation email:', error);
        emailError = error instanceof Error ? error.message : 'Failed to send email';
      }
    }

    return NextResponse.json(
      {
        patient,
        emailSent,
        message: emailSent
          ? `Patient invited successfully! An invitation email has been sent to ${validated.email}`
          : emailError
            ? `Patient created but invitation email failed: ${emailError}`
            : 'Patient created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to create patient:', error);
    return handleAuthError(error);
  }
}
