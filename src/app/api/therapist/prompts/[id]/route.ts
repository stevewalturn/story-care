/**
 * API Route: Therapist Prompt Detail
 * GET: Get prompt details
 * PATCH: Update own private prompt
 * DELETE: Delete own private prompt
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { moduleAiPromptsSchema } from '@/models/Schema';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyIdToken(token);

    const prompt = await db.query.moduleAiPromptsSchema.findFirst({
      where: eq(moduleAiPromptsSchema.id, id),
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.dbUserId;

    // Verify ownership
    const existingPrompt = await db.query.moduleAiPromptsSchema.findFirst({
      where: eq(moduleAiPromptsSchema.id, id),
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (existingPrompt.scope !== 'private' || existingPrompt.createdBy !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own private prompts' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, promptText, description, category, icon, isActive } = body;

    // Validate category if provided
    if (category) {
      const validCategories = ['analysis', 'creative', 'extraction', 'reflection'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 },
        );
      }
    }

    // Update prompt
    const [updatedPrompt] = await db
      .update(moduleAiPromptsSchema)
      .set({
        ...(name && { name }),
        ...(promptText && { promptText }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(moduleAiPromptsSchema.id, id))
      .returning();

    return NextResponse.json({ prompt: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.dbUserId;

    // Verify ownership
    const existingPrompt = await db.query.moduleAiPromptsSchema.findFirst({
      where: eq(moduleAiPromptsSchema.id, id),
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (existingPrompt.scope !== 'private' || existingPrompt.createdBy !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own private prompts' },
        { status: 403 },
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(moduleAiPromptsSchema)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(moduleAiPromptsSchema.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}
