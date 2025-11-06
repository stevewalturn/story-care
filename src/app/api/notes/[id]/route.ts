import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { notes } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/notes/[id] - Get single note
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: noteId } = await context.params;

    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: noteId } = await context.params;
    const body = await request.json();
    const {
      title,
      content,
      tags,
    } = body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (tags !== undefined) {
      updateData.tags = tags;
    }

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, noteId))
      .returning();

    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: noteId } = await context.params;

    const [deletedNote] = await db
      .delete(notes)
      .where(eq(notes.id, noteId))
      .returning();

    if (!deletedNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 },
    );
  }
}
