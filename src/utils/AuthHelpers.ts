/**
 * Authentication & Authorization Helpers for HIPAA Compliance
 *
 * These utilities provide secure authentication and role-based access control
 * for all API routes that handle Protected Health Information (PHI).
 *
 * HIPAA Requirements:
 * - Verify user identity before granting PHI access
 * - Enforce role-based access control (RBAC)
 * - Ensure therapists can only access their assigned patients
 * - Log all authentication failures for audit purposes
 */

import type { AuthenticatedUser } from '@/types/Organization';

import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

// Export the type for backward compatibility
export type { AuthenticatedUser } from '@/types/Organization';

/**
 * Requires valid authentication token from request
 *
 * @param request - Next.js request object
 * @returns Authenticated user information
 * @throws Error if authentication fails
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const user = await requireAuth(request);
 *   // user is authenticated, proceed with request
 * }
 * ```
 */
export async function requireAuth(
  request: Request,
): Promise<AuthenticatedUser> {
  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  // Extract token
  const token = authHeader.substring(7);

  if (!token) {
    throw new Error('Unauthorized: Empty token');
  }

  try {
    // Verify token with Firebase Admin SDK
    const user = await verifyIdToken(token);

    // Note: Email verification is now handled via invitation tokens, not Firebase
    // Users are verified when they complete the setup-account flow with a valid token

    return user;
  } catch (error) {
    // Token is invalid, expired, or revoked
    throw new Error(
      `Unauthorized: ${error instanceof Error ? error.message : 'Invalid token'}`,
    );
  }
}

/**
 * Requires user to have one of the specified roles
 *
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles that are permitted
 * @returns Authenticated user information
 * @throws Error if user doesn't have required role
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   // Only therapists and admins can create sessions
 *   const user = await requireRole(request, ['therapist', 'org_admin']);
 * }
 * ```
 */
export async function requireRole(
  request: Request,
  allowedRoles: Array<'super_admin' | 'org_admin' | 'therapist' | 'patient'>,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`,
    );
  }

  return user;
}

/**
 * Requires user to be a therapist or org admin
 * Convenience wrapper around requireRole
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const user = await requireTherapist(request);
 * }
 * ```
 */
export async function requireTherapist(
  request: Request,
): Promise<AuthenticatedUser> {
  return requireRole(request, ['therapist', 'org_admin', 'super_admin']);
}

/**
 * Requires user to be an org admin or super admin
 * Convenience wrapper around requireRole
 *
 * @example
 * ```typescript
 * export async function DELETE(request: Request) {
 *   const user = await requireAdmin(request);
 * }
 * ```
 */
export async function requireAdmin(
  request: Request,
): Promise<AuthenticatedUser> {
  return requireRole(request, ['org_admin', 'super_admin']);
}

/**
 * Handles authentication errors and returns appropriate Next.js response
 *
 * @param error - Error thrown by authentication functions
 * @returns Next.js response with appropriate status code
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   try {
 *     const user = await requireAuth(request);
 *     // ... handle request
 *   } catch (error) {
 *     return handleAuthError(error);
 *   }
 * }
 * ```
 */
export function handleAuthError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Authentication failed';

  if (message.includes('Unauthorized')) {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (message.includes('Forbidden')) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  // Log non-auth errors for debugging
  console.error('[handleAuthError] Non-auth error caught:', error);

  // Return more informative error in development, generic in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    { error: isDevelopment ? message : 'An error occurred' },
    { status: 500 },
  );
}

/**
 * Gets client information from request for audit logging
 *
 * @param request - Next.js request object
 * @returns Client IP address and user agent
 *
 * @example
 * ```typescript
 * const { ipAddress, userAgent } = getClientInfo(request);
 * await logAudit({
 *   userId: user.uid,
 *   action: 'read',
 *   resourceType: 'session',
 *   resourceId: sessionId,
 *   ipAddress,
 *   userAgent,
 * });
 * ```
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  // Try to get real IP from proxy headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2)
  // Take the first one (original client IP)
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Checks if user has access to a specific patient
 * Used for HIPAA-compliant patient data access control
 *
 * Rules:
 * - Super admin can access any patient (with audit logging)
 * - Org admin can access patients in their organization
 * - Patients can access their own data
 * - Therapists can access their assigned patients only
 *
 * @param user - Authenticated user
 * @param patientId - Patient UUID (database ID)
 * @param patientTherapistId - Therapist UUID (database ID) assigned to patient
 * @param patientOrgId - Organization ID of the patient
 * @returns True if user has access
 *
 * @example
 * ```typescript
 * const user = await requireAuth(request);
 * const patient = await db.query.users.findFirst({
 *   where: eq(users.id, patientId),
 * });
 *
 * if (!canAccessPatient(user, patientId, patient.therapistId, patient.organizationId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function canAccessPatient(
  user: AuthenticatedUser,
  patientId: string,
  patientTherapistId: string | null,
  patientOrgId?: string | null,
): boolean {
  // Super admin can access any patient
  if (user.role === 'super_admin') {
    return true;
  }

  // Org admin can access patients in their organization
  if (user.role === 'org_admin' && user.organizationId === patientOrgId) {
    return true;
  }

  // Patient can access their own data (compare database UUIDs)
  if (user.role === 'patient' && user.dbUserId === patientId) {
    return true;
  }

  // Therapist can access their assigned patients (compare database UUIDs) in same org
  if (
    user.role === 'therapist'
    && user.dbUserId === patientTherapistId
    && user.organizationId === patientOrgId
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts and validates pagination parameters from request URL
 *
 * @param request - Next.js request object
 * @returns Validated pagination parameters
 *
 * @example
 * ```typescript
 * const { page, limit, offset } = getPaginationParams(request);
 * const sessions = await db.query.sessions.findMany({
 *   limit,
 *   offset,
 * });
 * ```
 */
export function getPaginationParams(request: Request): {
  page: number;
  limit: number;
  offset: number;
} {
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(url.searchParams.get('limit') || '10', 10)),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Type guard to check if error is an authentication error
 */
export function isAuthError(error: unknown): error is Error {
  return (
    error instanceof Error
    && (error.message.includes('Unauthorized')
      || error.message.includes('Forbidden'))
  );
}

/**
 * Verifies that a therapist has access to a specific patient
 * by checking that the patient is assigned to this therapist.
 *
 * This is a critical HIPAA security control that must be called
 * before any operation that creates or accesses patient data.
 *
 * @param user - Authenticated user (from requireAuth)
 * @param patientId - Patient's database UUID
 * @returns Object with { hasAccess, patient } or { hasAccess: false, error }
 *
 * @example
 * ```typescript
 * const accessCheck = await verifyTherapistPatientAccess(user, patientId);
 * if (!accessCheck.hasAccess) {
 *   return NextResponse.json({ error: accessCheck.error }, { status: 403 });
 * }
 * ```
 */
export async function verifyTherapistPatientAccess(
  user: AuthenticatedUser,
  patientId: string,
): Promise<
  | { hasAccess: true; patient: { id: string; therapistId: string | null; organizationId: string | null } }
  | { hasAccess: false; error: string }
> {
  // Super admin can access any patient
  if (user.role === 'super_admin') {
    return { hasAccess: true, patient: { id: patientId, therapistId: null, organizationId: null } };
  }

  // Import db and users here to avoid circular dependencies
  const { db } = await import('@/libs/DB');
  const { users } = await import('@/models/Schema');
  const { eq } = await import('drizzle-orm');

  // Fetch the patient to verify access
  const [patient] = await db
    .select({
      id: users.id,
      therapistId: users.therapistId,
      organizationId: users.organizationId,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, patientId))
    .limit(1);

  if (!patient) {
    return { hasAccess: false, error: 'Patient not found' };
  }

  if (patient.role !== 'patient') {
    return { hasAccess: false, error: 'Invalid patient ID' };
  }

  // Org admin can access patients in their organization
  if (user.role === 'org_admin') {
    if (user.organizationId === patient.organizationId) {
      return { hasAccess: true, patient };
    }
    return { hasAccess: false, error: 'Forbidden: Patient is not in your organization' };
  }

  // Therapist can only access their assigned patients
  if (user.role === 'therapist') {
    if (patient.therapistId === user.dbUserId) {
      return { hasAccess: true, patient };
    }
    return { hasAccess: false, error: 'Forbidden: You do not have access to this patient' };
  }

  // Patient can only access their own data
  if (user.role === 'patient') {
    if (user.dbUserId === patientId) {
      return { hasAccess: true, patient };
    }
    return { hasAccess: false, error: 'Forbidden: You can only access your own data' };
  }

  return { hasAccess: false, error: 'Forbidden: Insufficient permissions' };
}
