/**
 * Super Admin Users API
 * List all users across all organizations
 */

import type { NextRequest } from 'next/server';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
import { organizationsSchema, usersSchema } from '@/models/Schema';

/**
 * GET /api/super-admin/users - List all users
 * Query params:
 *   - search: string (search by name or email)
 *   - role: string (filter by role)
 *   - page: number
 *   - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(usersSchema.name, `%${search}%`),
          ilike(usersSchema.email, `%${search}%`),
        ),
      );
    }

    if (role) {
      conditions.push(eq(usersSchema.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with their organization info
    const users = await db
      .select({
        id: usersSchema.id,
        email: usersSchema.email,
        name: usersSchema.name,
        role: usersSchema.role,
        status: usersSchema.status,
        firebaseUid: usersSchema.firebaseUid,
        organizationId: usersSchema.organizationId,
        organizationName: organizationsSchema.name,
        createdAt: usersSchema.createdAt,
        lastLoginAt: usersSchema.lastLoginAt,
      })
      .from(usersSchema)
      .leftJoin(
        organizationsSchema,
        eq(usersSchema.organizationId, organizationsSchema.id),
      )
      .where(whereClause)
      .orderBy(sql`${usersSchema.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersSchema)
      .where(whereClause);

    const count = countResult[0]?.count || 0;

    return NextResponse.json({
      users,
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
