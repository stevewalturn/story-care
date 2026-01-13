/**
 * API Route: Super Admin Prompt Detail
 * GET: Get prompt details
 * PATCH: Update any prompt
 * DELETE: Delete any prompt
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { moduleAiPromptsSchema, usersSchema } from '@/models/Schema';

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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify prompt exists
    const existingPrompt = await db.query.moduleAiPromptsSchema.findFirst({
      where: eq(moduleAiPromptsSchema.id, id),
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, systemPrompt, description, category, icon, isActive, outputType, jsonSchema, blocks } = body;

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

    // Validate outputType if provided
    if (outputType && !['text', 'json'].includes(outputType)) {
      return NextResponse.json(
        { error: 'Invalid outputType. Must be text or json' },
        { status: 400 },
      );
    }

    // Validate jsonSchema if provided
    if (jsonSchema !== undefined && jsonSchema !== null) {
      try {
        // Ensure it's valid JSON
        if (typeof jsonSchema === 'string') {
          JSON.parse(jsonSchema);
        } else if (typeof jsonSchema !== 'object') {
          throw new TypeError('Invalid JSON schema format');
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON schema format' },
          { status: 400 },
        );
      }
    }

    // Update prompt (super admin can edit any prompt)
    const [updatedPrompt] = await db
      .update(moduleAiPromptsSchema)
      .set({
        ...(name && { name }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(outputType !== undefined && { outputType }),
        ...(jsonSchema !== undefined && { jsonSchema }),
        ...(blocks !== undefined && { blocks }),
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify prompt exists
    const existingPrompt = await db.query.moduleAiPromptsSchema.findFirst({
      where: eq(moduleAiPromptsSchema.id, id),
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Soft delete (super admin can delete any prompt)
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
