/**
 * Role-Based Access Control (RBAC) Middleware
 * HIPAA Compliance - Ensures proper access control for PHI
 *
 * This middleware enforces role-based permissions and ensures:
 * 1. Therapists can only access their assigned patients
 * 2. Patients can only access their own data
 * 3. Admins have access scoped to their organization (except super_admin)
 * 4. Cross-user data access is prevented
 * 5. Cross-organization data access is prevented
 */

import type { AuthenticatedUser } from '@/types/Organization';
import { eq } from 'drizzle-orm';

import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { auditLogs, users } from '@/models/Schema';
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

  // Super admin has access to everything (with audit log)
  if (user.role === 'super_admin') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, patientId),
    });
    if (patient) {
      await requireSameOrg(user, patient.organizationId, 'patient', patientId);
    }
    return user;
  }

  // Org admin has access to all patients in their org
  if (user.role === 'org_admin') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, patientId),
    });
    if (!patient) {
      throw new Error('Patient not found');
    }
    await requireSameOrg(user, patient.organizationId, 'patient', patientId);
    return user;
  }

  // Patient accessing their own data
  if (user.role === 'patient' && user.dbUserId === patientId) {
    return user;
  }

  // Therapist - check if patient is assigned to them AND in same org
  if (user.role === 'therapist') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, patientId),
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Check org boundary
    await requireSameOrg(user, patient.organizationId, 'patient', patientId);

    if (patient.therapistId === user.dbUserId) {
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

  // Get the session to check ownership
  const session = await db.query.sessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.id, sessionId),
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Super admin has access to everything (with audit log)
  if (user.role === 'super_admin') {
    // Get therapist to find organization
    const therapist = await db.query.users.findFirst({
      where: eq(users.id, session.therapistId),
    });
    if (therapist) {
      await requireSameOrg(user, therapist.organizationId, 'session', sessionId);
    }
    return user;
  }

  // Org admin has access to all sessions in their org
  if (user.role === 'org_admin') {
    const therapist = await db.query.users.findFirst({
      where: eq(users.id, session.therapistId),
    });
    if (!therapist) {
      throw new Error('Session therapist not found');
    }
    await requireSameOrg(user, therapist.organizationId, 'session', sessionId);
    return user;
  }

  // Therapist accessing their own session
  if (user.role === 'therapist' && session.therapistId === user.dbUserId) {
    return user;
  }

  // Patient accessing their own session
  if (user.role === 'patient') {
    // Individual session assigned to this patient
    if (session.patientId === user.dbUserId) {
      return user;
    }

    // Group session - check if patient is in the group
    if (session.groupId) {
      const groupMember = await db.query.groupMembers.findFirst({
        where: (groupMembers, { and, eq, isNull }) =>
          and(
            eq(groupMembers.groupId, session.groupId!),
            eq(groupMembers.patientId, user.dbUserId),
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

  // Get the media to check ownership
  const media = await db.query.mediaLibrary.findFirst({
    where: (mediaLibrary, { eq }) => eq(mediaLibrary.id, mediaId),
  });

  if (!media) {
    throw new Error('Media not found');
  }

  // Super admin has access to everything (with audit log)
  if (user.role === 'super_admin') {
    // Get patient to find organization
    const patient = await db.query.users.findFirst({
      where: eq(users.id, media.patientId),
    });
    if (patient) {
      await requireSameOrg(user, patient.organizationId, 'media', mediaId);
    }
    return user;
  }

  // Org admin has access to all media in their org
  if (user.role === 'org_admin') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, media.patientId),
    });
    if (!patient) {
      throw new Error('Media patient not found');
    }
    await requireSameOrg(user, patient.organizationId, 'media', mediaId);
    return user;
  }

  // Therapist accessing media they created
  if (user.role === 'therapist' && media.createdByTherapistId === user.dbUserId) {
    return user;
  }

  // Patient accessing their own media
  if (user.role === 'patient' && media.patientId === user.dbUserId) {
    return user;
  }

  // If neither, check if patient is assigned to therapist (for therapist access)
  if (user.role === 'therapist') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, media.patientId),
    });

    // Check org boundary
    if (patient) {
      await requireSameOrg(user, patient.organizationId, 'media', mediaId);
      if (patient.therapistId === user.dbUserId) {
        return user;
      }
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

  // Get the page to check ownership
  const page = await db.query.storyPages.findFirst({
    where: (storyPages, { eq }) => eq(storyPages.id, pageId),
  });

  if (!page) {
    throw new Error('Story page not found');
  }

  // Super admin has access to everything (with audit log)
  if (user.role === 'super_admin') {
    // Get patient to find organization
    const patient = await db.query.users.findFirst({
      where: eq(users.id, page.patientId),
    });
    if (patient) {
      await requireSameOrg(user, patient.organizationId, 'story_page', pageId);
    }
    return user;
  }

  // Org admin has access to all story pages in their org
  if (user.role === 'org_admin') {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, page.patientId),
    });
    if (!patient) {
      throw new Error('Story page patient not found');
    }
    await requireSameOrg(user, patient.organizationId, 'story_page', pageId);
    return user;
  }

  // Therapist accessing page they created
  if (user.role === 'therapist' && page.createdByTherapistId === user.dbUserId) {
    return user;
  }

  // Patient accessing their own page (if published)
  if (user.role === 'patient' && page.patientId === user.dbUserId) {
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

  // Get the group to check ownership
  const group = await db.query.groups.findFirst({
    where: (groups, { eq }) => eq(groups.id, groupId),
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Super admin has access to everything (with audit log)
  if (user.role === 'super_admin') {
    await requireSameOrg(user, group.organizationId, 'group', groupId);
    return user;
  }

  // Org admin has access to all groups in their org
  if (user.role === 'org_admin') {
    await requireSameOrg(user, group.organizationId, 'group', groupId);
    return user;
  }

  // Therapist accessing their own group
  if (user.role === 'therapist' && group.therapistId === user.dbUserId) {
    return user;
  }

  // Patient accessing group they're a member of
  if (user.role === 'patient') {
    const membership = await db.query.groupMembers.findFirst({
      where: (groupMembers, { and, eq, isNull }) =>
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.patientId, user.dbUserId),
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
  // Get patient to check organization
  const patient = await db.query.users.findFirst({
    where: eq(users.id, patientId),
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Super admin can create for anyone (with audit log)
  if (user.role === 'super_admin') {
    await requireSameOrg(user, patient.organizationId, 'patient', patientId);
    return true;
  }

  // Org admin can create for any patient in their org
  if (user.role === 'org_admin') {
    await requireSameOrg(user, patient.organizationId, 'patient', patientId);
    return true;
  }

  // Only therapists can create for patients
  if (user.role !== 'therapist') {
    throw new Error('Forbidden: Only therapists can create patient resources');
  }

  // Check org boundary
  await requireSameOrg(user, patient.organizationId, 'patient', patientId);

  // Check if patient is assigned to this therapist
  if (patient.therapistId !== user.dbUserId) {
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

  // Log comprehensive error details for debugging
  console.error('RBAC Error Details:', {
    message,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    stack: error instanceof Error ? error.stack : undefined,
    fullError: error,
  });

  if (message.includes('not found')) {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (message.includes('Forbidden') || message.includes('not have access')) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (message.includes('Unauthorized')) {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // Generic error - include details in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    {
      error: 'Access control error',
      ...(isDevelopment && {
        details: message,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    },
    { status: 500 },
  );
}

// ============================================================================
// ORGANIZATION MULTI-TENANCY RBAC
// ============================================================================

/**
 * Verifies resource belongs to same organization as user
 * Super admin bypasses this check but access is logged
 *
 * @param user - Authenticated user
 * @param resourceOrgId - Organization ID of the resource
 * @param resourceType - Type of resource being accessed (for audit log)
 * @param resourceId - ID of resource being accessed (for audit log)
 * @returns void if access granted
 * @throws Error if access denied
 *
 * @example
 * ```typescript
 * const user = await requireAuth(request);
 * await requireSameOrg(user, patient.organizationId, 'patient', patientId);
 * ```
 */
export async function requireSameOrg(
  user: AuthenticatedUser,
  resourceOrgId: string | null,
  resourceType: string,
  resourceId: string,
): Promise<void> {
  // Super admin bypass (with audit logging)
  if (user.role === 'super_admin') {
    await db.insert(auditLogs).values({
      userId: user.dbUserId,
      organizationId: resourceOrgId,
      action: 'read',
      resourceType,
      resourceId,
      metadata: {
        note: 'Super admin cross-org access',
        userRole: 'super_admin',
      },
      timestamp: new Date(),
    });
    return;
  }

  // Org boundary check
  if (user.organizationId !== resourceOrgId) {
    // Log violation attempt
    await db.insert(auditLogs).values({
      userId: user.dbUserId,
      organizationId: user.organizationId,
      action: 'read',
      resourceType,
      resourceId,
      metadata: {
        note: 'Organization boundary violation attempt',
        attemptedOrgId: resourceOrgId,
        blocked: true,
      },
      timestamp: new Date(),
    });

    throw new Error(
      'Forbidden: Cannot access resource from different organization',
    );
  }
}

/**
 * Requires user to be an organization admin or super admin
 *
 * @param request - Next.js request
 * @returns Authenticated user if authorized
 * @throws Error if not authorized
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const user = await requireOrgAdmin(request);
 *   // User is org_admin or super_admin
 * }
 * ```
 */
export async function requireOrgAdmin(
  request: Request,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  if (user.role !== 'org_admin' && user.role !== 'super_admin') {
    throw new Error('Forbidden: Organization admin role required');
  }

  return user;
}

/**
 * Requires user to be a super admin
 *
 * @param request - Next.js request
 * @returns Authenticated user if authorized
 * @throws Error if not authorized
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const user = await requireSuperAdmin(request);
 *   // User is super_admin
 * }
 * ```
 */
export async function requireSuperAdmin(
  request: Request,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  if (user.role !== 'super_admin') {
    throw new Error('Forbidden: Super admin role required');
  }

  return user;
}

/**
 * Verifies user can change another user's role
 * Only super admin can change roles
 *
 * @param request - Next.js request
 * @param targetUserId - User whose role will be changed
 * @returns Authenticated user if authorized
 * @throws Error if not authorized
 */
export async function canChangeUserRole(
  request: Request,
  targetUserId: string,
): Promise<AuthenticatedUser> {
  const user = await requireSuperAdmin(request);

  // Get target user
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  // Cannot change super_admin role
  if (targetUser.role === 'super_admin') {
    throw new Error('Forbidden: Cannot change super admin role');
  }

  return user;
}
