/**
 * Super Admin Audit Logs API
 * View all audit logs across the platform
 */

import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
import { auditLogsSchema, usersSchema } from '@/models/Schema';

/**
 * GET /api/super-admin/audit - List audit logs
 * Query params:
 *   - search: string (search by resource type, ID, or user)
 *   - action: string (filter by action type)
 *   - startDate: string (ISO date)
 *   - endDate: string (ISO date)
 *   - page: number
 *   - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        ilike(auditLogsSchema.resourceType, `%${search}%`),
      );
    }

    if (action) {
      conditions.push(eq(auditLogsSchema.action, action as any));
    }

    if (startDate) {
      conditions.push(gte(auditLogsSchema.timestamp, new Date(startDate)));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogsSchema.timestamp, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get audit logs with user information
    const logs = await db
      .select({
        id: auditLogsSchema.id,
        userId: auditLogsSchema.userId,
        userName: usersSchema.name,
        userEmail: usersSchema.email,
        action: auditLogsSchema.action,
        resourceType: auditLogsSchema.resourceType,
        resourceId: auditLogsSchema.resourceId,
        ipAddress: auditLogsSchema.ipAddress,
        userAgent: auditLogsSchema.userAgent,
        metadata: auditLogsSchema.metadata,
        timestamp: auditLogsSchema.timestamp,
      })
      .from(auditLogsSchema)
      .leftJoin(usersSchema, eq(auditLogsSchema.userId, usersSchema.id))
      .where(whereClause)
      .orderBy(desc(auditLogsSchema.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogsSchema)
      .where(whereClause);

    const count = countResult[0]?.count || 0;

    // Get statistics for the filtered date range
    const statsWhere = [];
    if (startDate) {
      statsWhere.push(gte(auditLogsSchema.timestamp, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      statsWhere.push(lte(auditLogsSchema.timestamp, end));
    }

    const statsWhereClause = statsWhere.length > 0 ? and(...statsWhere) : undefined;

    const stats = await db
      .select({
        totalEvents: sql<number>`count(*)::int`,
        failedLogins: sql<number>`count(*) filter (where ${auditLogsSchema.action} = 'auth_failed')::int`,
        criticalEvents: sql<number>`count(*) filter (where ${auditLogsSchema.action} in ('delete', 'export'))::int`,
      })
      .from(auditLogsSchema)
      .where(statsWhereClause);

    return NextResponse.json({
      logs,
      stats: stats[0] || { totalEvents: 0, failedLogins: 0, criticalEvents: 0 },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return handleRBACError(error);
  }
}
