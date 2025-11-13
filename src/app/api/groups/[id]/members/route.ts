import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { groupMembers, users } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

// GET /api/groups/[id]/members - Get all members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 0. RESOLVE PARAMS (Next.js 15+ async params)
    const resolvedParams = await params;

    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. FETCH GROUP MEMBERS
    const members = await db
      .select({
        id: groupMembers.id,
        patientId: groupMembers.patientId,
        joinedAt: groupMembers.joinedAt,
        leftAt: groupMembers.leftAt,
        patient: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.patientId, users.id))
      .where(eq(groupMembers.groupId, resolvedParams.id));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return handleAuthError(error);
  }
}
