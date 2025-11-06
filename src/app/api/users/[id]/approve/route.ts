/**
 * User Approval API
 * Org Admin can approve pending users in their organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { canApproveUser, handleRBACError } from '@/middleware/RBACMiddleware';
import { approveUserSchema } from '@/validations/OrganizationValidation';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

/**
 * POST /api/users/[id]/approve - Approve pending user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await canApproveUser(request, id);

    const body = await request.json();
    const validated = approveUserSchema.parse(body);

    // Update user status and role
    const [approvedUser] = await db
      .update(users)
      .set({
        status: 'active',
        role: validated.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!approvedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: approvedUser });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
