import type { NextRequest } from 'next/server';
import { and, eq, like } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { groupMembers, groups, users } from '@/models/Schema';

// GET /api/groups - List groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistFirebaseUid = searchParams.get('therapistId');

    const conditions = [];

    if (search) {
      conditions.push(like(groups.name, `%${search}%`));
    }

    // If therapistId is provided, it's a Firebase UID, so we need to look up the user first
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (!therapist) {
        // User doesn't exist yet in database, return empty groups array
        return NextResponse.json({ groups: [] });
      }

      conditions.push(eq(groups.therapistId, therapist.id));
    }

    const groupsList = conditions.length > 0
      ? await db.select().from(groups).where(and(...conditions))
      : await db.select().from(groups);

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
    const { name, description, memberIds, therapistId: therapistFirebaseUid } = body;

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one member are required' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID if provided
    let therapistDbId = null;
    let organizationId = null;
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id, organizationId: users.organizationId })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (!therapist) {
        return NextResponse.json(
          { error: 'Therapist not found' },
          { status: 404 },
        );
      }

      therapistDbId = therapist.id;
      organizationId = therapist.organizationId;
    }

    // Create group
    const [group] = await db
      .insert(groups)
      .values({
        name,
        description: description || null,
        therapistId: therapistDbId,
        organizationId: organizationId!,
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
