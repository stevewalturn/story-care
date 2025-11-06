/**
 * User Rejection API
 * Org Admin can reject pending users in their organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  requirePendingUserAccess,
  handleRBACError,
} from '@/middleware/RBACMiddleware';
import { rejectUserSchema } from '@/validations/OrganizationValidation';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

/**
 * POST /api/users/[id]/reject - Reject pending user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requirePendingUserAccess(request, id);

    const body = await request.json();
    const { reason } = rejectUserSchema.parse(body);

    // Update user status to inactive
    const [rejectedUser] = await db
      .update(users)
      .set({
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!rejectedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Send rejection email with reason

    return NextResponse.json({ success: true, reason });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
