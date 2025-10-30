import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { groups, groupMembers, users } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// GET /api/groups/[id] - Get single group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, params.id))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Fetch members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, group.id));

    return NextResponse.json({ group: { ...group, members } });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, memberIds } = body;

    // Update group
    const [updatedGroup] = await db
      .update(groups)
      .set({
        name,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, params.id))
      .returning();

    if (!updatedGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Update members if provided
    if (memberIds) {
      // Remove existing members
      await db.delete(groupMembers).where(eq(groupMembers.groupId, params.id));

      // Add new members
      if (memberIds.length > 0) {
        await db.insert(groupMembers).values(
          memberIds.map((userId: string) => ({
            groupId: params.id,
            userId,
          }))
        );
      }
    }

    // Fetch updated group with members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, params.id));

    return NextResponse.json({ group: { ...updatedGroup, members } });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete group members first (cascade)
    await db.delete(groupMembers).where(eq(groupMembers.groupId, params.id));

    // Delete group
    const [deletedGroup] = await db
      .delete(groups)
      .where(eq(groups.id, params.id))
      .returning();

    if (!deletedGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
