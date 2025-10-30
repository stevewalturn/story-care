import type { NextRequest } from 'next/server';
import { eq, like } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { groupMembers, groups, users } from '@/models/Schema';

// GET /api/groups - List groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistId = searchParams.get('therapistId');

    let query = db.select().from(groups);

    if (search) {
      query = query.where(like(groups.name, `%${search}%`)) as any;
    }

    if (therapistId) {
      query = query.where(eq(groups.therapistId, therapistId)) as any;
    }

    const groupsList = await query;

    // Fetch members for each group
    const groupsWithMembers = await Promise.all(
      groupsList.map(async (group) => {
        const members = await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          })
          .from(groupMembers)
          .innerJoin(users, eq(groupMembers.patientId, users.id))
          .where(eq(groupMembers.groupId, group.id));

        return {
          ...group,
          members,
        };
      }),
    );

    return NextResponse.json({ groups: groupsWithMembers });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 },
    );
  }
}

// POST /api/groups - Create group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, memberIds, therapistId } = body;

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one member are required' },
        { status: 400 },
      );
    }

    // Create group
    const [group] = await db
      .insert(groups)
      .values({
        name,
        description: description || null,
        therapistId: therapistId || null,
      })
      .returning();

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 },
      );
    }

    // Add members
    await db.insert(groupMembers).values(
      memberIds.map((patientId: string) => ({
        groupId: group.id,
        patientId,
      })),
    );

    // Fetch complete group with members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.patientId, users.id))
      .where(eq(groupMembers.groupId, group.id));

    return NextResponse.json(
      { group: { ...group, members } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 },
    );
  }
}
