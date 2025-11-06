/**
 * User Role Change API
 * Super Admin can change user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { canChangeUserRole, handleRBACError } from '@/middleware/RBACMiddleware';
import { changeUserRoleSchema } from '@/validations/OrganizationValidation';
import { db } from '@/libs/DB';
import { users, auditLogsSchema } from '@/models/Schema';

/**
 * POST /api/users/[id]/change-role - Change user role (Super Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await canChangeUserRole(request, id);

    const body = await request.json();
    const { newRole, reason } = changeUserRoleSchema.parse(body);

    // Get current user data
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = targetUser.role;

    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    // Audit log
    await db.insert(auditLogsSchema).values({
      userId: user.dbUserId,
      organizationId: user.organizationId,
      action: 'update',
      resourceType: 'user_role',
      resourceId: id,
      metadata: {
        oldRole,
        newRole,
        reason,
        changedBy: user.dbUserId,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      user: updatedUser,
      oldRole,
      newRole,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
