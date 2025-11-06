/**
 * Audit Logging Service
 * HIPAA-compliant audit logging for all PHI access and modifications
 *
 * Required by HIPAA Security Rule:
 * - Log all access to Protected Health Information (PHI)
 * - Track who, what, when, where, and why
 * - Retain logs for minimum 7 years
 * - Ensure logs are tamper-proof (write-only for most users)
 */

import type { AuthenticatedUser } from '@/types/Organization';
import { db } from '@/libs/DB';
import { auditLogs } from '@/models/Schema';

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'auth_success' | 'auth_failed' | 'logout' | 'export';

export type AuditResourceType
  = | 'user'
    | 'patient'
    | 'session'
    | 'transcript'
    | 'media'
    | 'story_page'
    | 'reflection_question'
    | 'survey_question'
    | 'reflection_response'
    | 'survey_response'
    | 'template';

export type AuditLogEntry = {
  userId: string; // Database UUID
  organizationId?: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  metadata?: Record<string, any>;
};

/**
 * Create an audit log entry
 * This function never throws - failures are logged but don't interrupt the request
 *
 * @param entry - Audit log entry data
 *
 * @example
 * ```typescript
 * await createAuditLog({
 *   userId: user.dbUserId,
 *   organizationId: user.organizationId,
 *   action: 'read',
 *   resourceType: 'patient',
 *   resourceId: patientId,
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   requestMethod: 'GET',
 *   requestPath: '/api/patients/123',
 * });
 * ```
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      organizationId: entry.organizationId || null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      requestMethod: entry.requestMethod || null,
      requestPath: entry.requestPath || null,
      metadata: entry.metadata || null,
    });
  } catch (error) {
    // CRITICAL: Audit logging failure should be logged but not interrupt the request
    // In production, you'd want to alert on audit logging failures
    console.error('AUDIT LOG FAILURE:', {
      error,
      entry,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send alert to monitoring service (e.g., Sentry, PagerDuty)
    // This is a critical security event that requires investigation
  }
}

/**
 * Helper to create audit log from request and user
 *
 * @param request - Next.js request object
 * @param user - Authenticated user
 * @param action - Action being performed
 * @param resourceType - Type of resource being accessed
 * @param resourceId - ID of resource being accessed (optional)
 * @param metadata - Additional context (optional)
 *
 * @example
 * ```typescript
 * await logAuditFromRequest(request, user, 'read', 'patient', patientId);
 * ```
 */
export async function logAuditFromRequest(
  request: Request,
  user: AuthenticatedUser,
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId?: string | null,
  metadata?: Record<string, any>,
): Promise<void> {
  const url = new URL(request.url);

  // Extract client info
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await createAuditLog({
    userId: user.dbUserId,
    organizationId: user.organizationId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    requestMethod: request.method,
    requestPath: url.pathname,
    metadata,
  });
}

/**
 * Helper to log PHI access (Protected Health Information)
 * Automatically determines resource type and ensures proper logging
 *
 * @param request - Next.js request object
 * @param user - Authenticated user
 * @param action - Action being performed
 * @param phiType - Type of PHI being accessed
 * @param resourceId - ID of PHI resource
 * @param patientId - Patient ID (for linking to patient record)
 *
 * @example
 * ```typescript
 * await logPHIAccess(request, user, 'read', 'reflection_response', responseId, patientId);
 * ```
 */
export async function logPHIAccess(
  request: Request,
  user: AuthenticatedUser,
  action: AuditAction,
  phiType: AuditResourceType,
  resourceId: string,
  patientId?: string,
): Promise<void> {
  await logAuditFromRequest(request, user, action, phiType, resourceId, {
    patientId,
    isPHI: true,
    accessReason: 'clinical_workflow', // Could be expanded to require explicit reason
  });
}

/**
 * Helper to log bulk PHI access (e.g., listing patient responses)
 *
 * @param request - Next.js request object
 * @param user - Authenticated user
 * @param phiType - Type of PHI being accessed
 * @param count - Number of records accessed
 * @param patientIds - Array of patient IDs affected
 *
 * @example
 * ```typescript
 * await logBulkPHIAccess(request, user, 'reflection_response', 25, [patientId1, patientId2]);
 * ```
 */
export async function logBulkPHIAccess(
  request: Request,
  user: AuthenticatedUser,
  phiType: AuditResourceType,
  count: number,
  patientIds?: string[],
): Promise<void> {
  await logAuditFromRequest(request, user, 'read', phiType, null, {
    isBulkAccess: true,
    recordCount: count,
    patientIds: patientIds?.slice(0, 100), // Limit to first 100 to avoid huge logs
    isPHI: true,
  });
}
