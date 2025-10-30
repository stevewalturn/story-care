import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, users, groups, groupMembers } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// GET /api/sessions/[id] - Get single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [session] = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        audioUrl: sessions.audioUrl,
        audioDuration: sessions.audioDuration,
        status: sessions.status,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        therapistId: sessions.therapistId,
        patientId: sessions.patientId,
        groupId: sessions.groupId,
      })
      .from(sessions)
      .where(eq(sessions.id, params.id))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch patient info if individual session
    if (session.patientId) {
      const [patient] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, session.patientId))
        .limit(1);

      return NextResponse.json({
        session: {
          ...session,
          patient,
        },
      });
    }

    // Fetch group info if group session
    if (session.groupId) {
      const [group] = await db
        .select({
          id: groups.id,
          name: groups.name,
        })
        .from(groups)
        .where(eq(groups.id, session.groupId))
        .limit(1);

      // Fetch group members
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, session.groupId));

      return NextResponse.json({
        session: {
          ...session,
          group: {
            ...group,
            members,
          },
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, sessionDate, audioUrl, audioDuration, status } = body;

    const [updatedSession] = await db
      .update(sessions)
      .set({
        title,
        sessionDate: sessionDate ? new Date(sessionDate) : undefined,
        audioUrl,
        audioDuration,
        status,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, params.id))
      .returning();

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedSession] = await db
      .delete(sessions)
      .where(eq(sessions.id, params.id))
      .returning();

    if (!deletedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
