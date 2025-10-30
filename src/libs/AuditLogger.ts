/**
 * Audit Logger for HIPAA Compliance
 *
 * This utility provides comprehensive audit logging for all PHI (Protected Health Information)
 * access and modifications. HIPAA requires a complete audit trail that includes:
 * - Who accessed/modified the data (user ID)
 * - What action was performed (create, read, update, delete)
 * - When it occurred (timestamp)
 * - Where it came from (IP address, user agent)
 * - What was accessed/modified (resource type and ID)
 *
 * Retention: Audit logs must be retained for 7 years per HIPAA requirements.
 */

import { db } from './DB';
import { auditLogs, type NewAuditLog } from '@/models/Schema';
import { getLogger } from '@logtape/logtape';

const logger = getLogger(['audit']);

/**
 * Audit log action types
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'auth_success'
  | 'auth_failed'
  | 'logout';

/**
 * Resource types that can be audited
 */
export type ResourceType =
  | 'user'
  | 'session'
  | 'transcript'
  | 'speaker'
  | 'utterance'
  | 'media'
  | 'quote'
  | 'note'
  | 'scene'
  | 'story_page'
  | 'reflection_response'
  | 'survey_response'
  | 'group'
  | 'auth';

/**
 * Data structure for audit log entries
 */
export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs an audit event to the database
 *
 * This function is non-blocking and will not throw errors to prevent
 * audit logging failures from breaking application functionality.
 *
 * @param data - Audit log data
 * @returns Promise that resolves when log is written
 *
 * @example
 * ```typescript
 * await logAudit({
 *   userId: user.uid,
 *   action: 'read',
 *   resourceType: 'session',
 *   resourceId: sessionId,
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 * });
 * ```
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const logEntry: NewAuditLog = {
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      requestMethod: data.requestMethod || null,
      requestPath: data.requestPath || null,
      metadata: data.metadata || null,
      timestamp: new Date(),
    };

    await db.insert(auditLogs).values(logEntry);

    // Also log to application logger for real-time monitoring
    logger.info('Audit log created', {
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
    });
  } catch (error) {
    // Critical: Audit logging failure should be logged but not throw
    // We don't want audit failures to break application functionality
    logger.error('Failed to write audit log', { error, data });
    console.error('AUDIT LOG FAILURE:', error, data);
  }
}

/**
 * Extracts client information from Next.js request
 *
 * @param request - Next.js Request object
 * @returns Client IP address and user agent
 *
 * @example
 * ```typescript
 * const clientInfo = getClientInfo(request);
 * await logAudit({
 *   ...clientInfo,
 *   userId: user.uid,
 *   action: 'read',
 *   resourceType: 'session',
 *   resourceId: sessionId,
 * });
 * ```
 */
export function getClientInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
  requestMethod: string;
  requestPath: string;
} {
  // Try to get real IP from proxy headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2)
  // Take the first one (original client IP)
  const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  const url = new URL(request.url);
  const requestMethod = request.method;
  const requestPath = url.pathname;

  return { ipAddress, userAgent, requestMethod, requestPath };
}

/**
 * Logs successful authentication event
 *
 * @param userId - User ID who logged in
 * @param request - Next.js Request object
 *
 * @example
 * ```typescript
 * await logAuthSuccess(user.uid, request);
 * ```
 */
export async function logAuthSuccess(
  userId: string,
  request: Request,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'auth_success',
    resourceType: 'auth',
    ...clientInfo,
  });
}

/**
 * Logs failed authentication attempt
 *
 * @param email - Email address of failed login attempt
 * @param request - Next.js Request object
 * @param reason - Reason for failure (optional)
 *
 * @example
 * ```typescript
 * await logAuthFailed('user@example.com', request, 'Invalid password');
 * ```
 */
export async function logAuthFailed(
  email: string,
  request: Request,
  reason?: string,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId: 'anonymous', // No user ID for failed auth
    action: 'auth_failed',
    resourceType: 'auth',
    ...clientInfo,
    metadata: { email, reason },
  });
}

/**
 * Logs user logout event
 *
 * @param userId - User ID who logged out
 * @param request - Next.js Request object
 *
 * @example
 * ```typescript
 * await logLogout(user.uid, request);
 * ```
 */
export async function logLogout(
  userId: string,
  request: Request,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'logout',
    resourceType: 'auth',
    ...clientInfo,
  });
}

/**
 * Logs PHI data access (read operation)
 *
 * @param userId - User ID who accessed the data
 * @param resourceType - Type of resource accessed
 * @param resourceId - ID of the resource
 * @param request - Next.js Request object
 *
 * @example
 * ```typescript
 * await logPHIAccess(user.uid, 'session', sessionId, request);
 * ```
 */
export async function logPHIAccess(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  request: Request,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'read',
    resourceType,
    resourceId,
    ...clientInfo,
  });
}

/**
 * Logs PHI data creation
 *
 * @param userId - User ID who created the data
 * @param resourceType - Type of resource created
 * @param resourceId - ID of the created resource
 * @param request - Next.js Request object
 * @param metadata - Optional additional context
 *
 * @example
 * ```typescript
 * await logPHICreate(user.uid, 'session', newSession.id, request, {
 *   patientId: patient.id,
 *   sessionType: 'individual',
 * });
 * ```
 */
export async function logPHICreate(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  request: Request,
  metadata?: Record<string, any>,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'create',
    resourceType,
    resourceId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Logs PHI data modification
 *
 * @param userId - User ID who modified the data
 * @param resourceType - Type of resource modified
 * @param resourceId - ID of the modified resource
 * @param request - Next.js Request object
 * @param metadata - Optional additional context (old values, new values)
 *
 * @example
 * ```typescript
 * await logPHIUpdate(user.uid, 'session', session.id, request, {
 *   changedFields: ['title', 'sessionDate'],
 *   oldTitle: 'Old Title',
 *   newTitle: 'New Title',
 * });
 * ```
 */
export async function logPHIUpdate(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  request: Request,
  metadata?: Record<string, any>,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'update',
    resourceType,
    resourceId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Logs PHI data deletion (soft delete)
 *
 * @param userId - User ID who deleted the data
 * @param resourceType - Type of resource deleted
 * @param resourceId - ID of the deleted resource
 * @param request - Next.js Request object
 * @param metadata - Optional additional context
 *
 * @example
 * ```typescript
 * await logPHIDelete(user.uid, 'session', session.id, request, {
 *   softDelete: true,
 *   deletionReason: 'Patient request',
 * });
 * ```
 */
export async function logPHIDelete(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  request: Request,
  metadata?: Record<string, any>,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'delete',
    resourceType,
    resourceId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Logs PHI data export
 *
 * @param userId - User ID who exported the data
 * @param resourceType - Type of resource exported
 * @param resourceId - ID of the exported resource (or 'bulk' for bulk exports)
 * @param request - Next.js Request object
 * @param metadata - Optional additional context (export format, filters, etc.)
 *
 * @example
 * ```typescript
 * await logPHIExport(user.uid, 'session', 'bulk', request, {
 *   format: 'json',
 *   patientId: patient.id,
 *   recordCount: 50,
 * });
 * ```
 */
export async function logPHIExport(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  request: Request,
  metadata?: Record<string, any>,
): Promise<void> {
  const clientInfo = getClientInfo(request);
  await logAudit({
    userId,
    action: 'export',
    resourceType,
    resourceId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Queries audit logs for a specific user's activity
 *
 * @param userId - User ID to query
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * const userActivity = await getAuditLogsForUser(user.uid, 50);
 * ```
 */
export async function getAuditLogsForUser(
  userId: string,
  limit = 100,
): Promise<any[]> {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { eq }) => eq(auditLogs.userId, userId),
    limit,
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
  });
}

/**
 * Queries audit logs for a specific resource
 *
 * @param resourceType - Type of resource
 * @param resourceId - ID of the resource
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * const sessionAccessLog = await getAuditLogsForResource('session', sessionId, 50);
 * ```
 */
export async function getAuditLogsForResource(
  resourceType: ResourceType,
  resourceId: string,
  limit = 100,
): Promise<any[]> {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { and, eq }) =>
      and(
        eq(auditLogs.resourceType, resourceType),
        eq(auditLogs.resourceId, resourceId),
      ),
    limit,
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
  });
}

/**
 * Queries recent failed authentication attempts from an IP
 *
 * @param ipAddress - IP address to check
 * @param timeWindowMinutes - Time window to check (default: 15 minutes)
 * @returns Number of failed attempts
 *
 * @example
 * ```typescript
 * const failedAttempts = await getFailedAuthAttempts('192.168.1.1', 15);
 * if (failedAttempts >= 5) {
 *   // Block this IP
 * }
 * ```
 */
export async function getFailedAuthAttempts(
  ipAddress: string,
  timeWindowMinutes = 15,
): Promise<number> {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const logs = await db.query.auditLogs.findMany({
    where: (auditLogs, { and, eq, gte }) =>
      and(
        eq(auditLogs.action, 'auth_failed'),
        eq(auditLogs.ipAddress, ipAddress),
        gte(auditLogs.timestamp, since),
      ),
  });

  return logs.length;
}
