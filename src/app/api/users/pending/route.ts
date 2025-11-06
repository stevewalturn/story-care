/**
 * Pending Users API
 * Org Admin can list pending users in their organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { requireOrgAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

/**
 * GET /api/users/pending - List pending users
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);

    // Org admin sees only their org's pending users
    // Super admin can see all pending users (with optional org filter)
    const { searchParams } = new URL(request.url);
    const organizationId =
      user.role === 'super_admin'
        ? searchParams.get('organizationId') || user.organizationId
        : user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 },
      );
    }

    const pendingUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.status, 'pending_approval'),
        ),
      )
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    return handleRBACError(error);
  }
}
