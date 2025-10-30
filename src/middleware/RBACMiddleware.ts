/**
 * Role-Based Access Control (RBAC) Middleware
 * HIPAA Compliance - Ensures proper access control for PHI
 *
 * This middleware enforces role-based permissions and ensures:
 * 1. Therapists can only access their assigned patients
 * 2. Patients can only access their own data
 * 3. Admins have full access (with audit logging)
 * 4. Cross-user data access is prevented
 */

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import type { AuthenticatedUser } from '@/utils/AuthHelpers';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { requireAuth } from '@/utils/AuthHelpers';

/**
 * Verifies user has access to a specific patient's data
 *
 * Access rules:
 * - Admin: Can access any patient
 * - Patient: Can only access their own data
 * - Therapist: Can only access assigned patients
 *
 * @param request - Next.js request
 * @param patientId - Patient UUID to check access for
 * @returns Authenticated user if access granted
 * @throws Error if access denied
 *
 * @example
 * ```typescript
 * export async function GET(
 *   request: Request,
 *   { params }: { params: { patientId: string } }
 * ) {
 *   const user = await requirePatientAccess(request, params.patientId);
 *   // User has access, proceed
 * }
 * ```
 */
export async function requirePatientAccess(
  request: Request,
  patientId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  // Admin has access to everything
  if (user.role === 'admin') {
    return user;
  }

  // Patient accessing their own data
  if (user.role === 'patient' && user.uid === patientId) {
    return user;
  }

  // Therapist - check if patient is assigned to them
  if (user.role === 'therapist') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, patientId),
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    if (patient.therapistId === user.uid) {
      return user;
    }
  }

  throw new Error(
    'Forbidden: You do not have access to this patient\'s data',
  );
}

/**
 * Verifies user has access to a specific session
 *
 * @param request - Next.js request
 * @param sessionId - Session UUID to check access for
 * @returns Authenticated user if access granted
 * @throws Error if access denied
 *
 * @example
 * ```typescript
 * export async function GET(
 *   request: Request,
 *   { params }: { params: { sessionId: string } }
 * ) {
 *   const user = await requireSessionAccess(request, params.sessionId);
 *   // User has access, proceed
 * }
 * ```
 */
export async function requireSessionAccess(
  request: Request,
  sessionId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  // Admin has access to everything
  if (user.role === 'admin') {
    return user;
  }

  // Get the session to check ownership
  const session = await db.query.sessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.id, sessionId),
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Therapist accessing their own session
  if (user.role === 'therapist' && session.therapistId === user.uid) {
    return user;
  }

  // Patient accessing their own session
  if (user.role === 'patient') {
    // Individual session assigned to this patient
    if (session.patientId === user.uid) {
      return user;
    }

    // Group session - check if patient is in the group
    if (session.groupId) {
      const groupMember = await db.query.groupMembers.findFirst({
        where: (groupMembers, { and, eq, isNull }) =>
          and(
            eq(groupMembers.groupId, session.groupId!),
            eq(groupMembers.patientId, user.uid),
            isNull(groupMembers.leftAt), // Still active member
          ),
      });

      if (groupMember) {
        return user;
      }
    }
  }

  throw new Error('Forbidden: You do not have access to this session');
}

/**
 * Verifies user has access to specific media
 *
 * @param request - Next.js request
 * @param mediaId - Media UUID to check access for
 * @returns Authenticated user if access granted
 * @throws Error if access denied
 */
export async function requireMediaAccess(
  request: Request,
  mediaId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  // Admin has access to everything
  if (user.role === 'admin') {
    return user;
  }

  // Get the media to check ownership
  const media = await db.query.mediaLibrary.findFirst({
    where: (mediaLibrary, { eq }) => eq(mediaLibrary.id, mediaId),
  });

  if (!media) {
    throw new Error('Media not found');
  }

  // Therapist accessing media they created
  if (user.role === 'therapist' && media.createdByTherapistId === user.uid) {
    return user;
  }

  // Patient accessing their own media
  if (user.role === 'patient' && media.patientId === user.uid) {
    return user;
  }

  // If neither, check if patient is assigned to therapist (for therapist access)
  if (user.role === 'therapist') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, media.patientId),
    });

    if (patient?.therapistId === user.uid) {
      return user;
    }
  }

  throw new Error('Forbidden: You do not have access to this media');
}

/**
 * Verifies user has access to a story page
 *
 * @param request - Next.js request
 * @param pageId - Story page UUID to check access for
 * @returns Authenticated user if access granted
 * @throws Error if access denied
 */
export async function requireStoryPageAccess(
  request: Request,
  pageId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  // Admin has access to everything
  if (user.role === 'admin') {
    return user;
  }

  // Get the page to check ownership
  const page = await db.query.storyPages.findFirst({
    where: (storyPages, { eq }) => eq(storyPages.id, pageId),
  });

  if (!page) {
    throw new Error('Story page not found');
  }

  // Therapist accessing page they created
  if (user.role === 'therapist' && page.createdByTherapistId === user.uid) {
    return user;
  }

  // Patient accessing their own page (if published)
  if (user.role === 'patient' && page.patientId === user.uid) {
    // Check if page is published or patient-visible
    if (page.status === 'published') {
      return user;
    }
    throw new Error('Forbidden: This page is not yet published');
  }

  throw new Error('Forbidden: You do not have access to this story page');
}

/**
 * Verifies user has access to a group
 *
 * @param request - Next.js request
 * @param groupId - Group UUID to check access for
 * @returns Authenticated user if access granted
 * @throws Error if access denied
 */
export async function requireGroupAccess(
  request: Request,
  groupId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  // Admin has access to everything
  if (user.role === 'admin') {
    return user;
  }

  // Get the group to check ownership
  const group = await db.query.groups.findFirst({
    where: (groups, { eq }) => eq(groups.id, groupId),
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Therapist accessing their own group
  if (user.role === 'therapist' && group.therapistId === user.uid) {
    return user;
  }

  // Patient accessing group they're a member of
  if (user.role === 'patient') {
    const membership = await db.query.groupMembers.findFirst({
      where: (groupMembers, { and, eq, isNull }) =>
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.patientId, user.uid),
          isNull(groupMembers.leftAt), // Still active member
        ),
    });

    if (membership) {
      return user;
    }
  }

  throw new Error('Forbidden: You do not have access to this group');
}

/**
 * Checks if user can create resources for a patient
 * (Only therapists and admins can create for patients)
 *
 * @param user - Authenticated user
 * @param patientId - Target patient ID
 * @returns True if user can create resources
 * @throws Error if not authorized
 */
export async function canCreateForPatient(
  user: AuthenticatedUser,
  patientId: string,
): Promise<boolean> {
  // Admin can create for anyone
  if (user.role === 'admin') {
    return true;
  }

  // Only therapists can create for patients
  if (user.role !== 'therapist') {
    throw new Error('Forbidden: Only therapists can create patient resources');
  }

  // Check if patient is assigned to this therapist
  const patient = await db.query.users.findFirst({
    where: eq(users.id, patientId),
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  if (patient.therapistId !== user.uid) {
    throw new Error(
      'Forbidden: You can only create resources for your assigned patients',
    );
  }

  return true;
}

/**
 * Helper to handle RBAC errors in API routes
 *
 * @param error - Error from RBAC check
 * @returns NextResponse with appropriate status code
 *
 * @example
 * ```typescript
 * try {
 *   const user = await requirePatientAccess(request, patientId);
 *   // ... handle request
 * } catch (error) {
 *   return handleRBACError(error);
 * }
 * ```
 */
export function handleRBACError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Access denied';

  if (message.includes('not found')) {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (message.includes('Forbidden') || message.includes('not have access')) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (message.includes('Unauthorized')) {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // Generic error
  return NextResponse.json(
    { error: 'Access control error' },
    { status: 500 },
  );
}
