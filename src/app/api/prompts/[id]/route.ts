import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { therapeuticPrompts } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// PUT /api/prompts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, promptText, category, tags, isFavorite } = body;

    const [updatedPrompt] = await db
      .update(therapeuticPrompts)
      .set({
        title,
        description,
        promptText,
        category,
        tags,
        isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(therapeuticPrompts.id, params.id))
      .returning();

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedPrompt] = await db
      .delete(therapeuticPrompts)
      .where(eq(therapeuticPrompts.id, params.id))
      .returning();

    if (!deletedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
