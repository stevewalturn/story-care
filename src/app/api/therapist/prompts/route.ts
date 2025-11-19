/**
 * API Route: Therapist Prompts
 * GET: List all accessible prompts (system + org + private)
 * POST: Create new private prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { moduleAiPromptsSchema } from '@/models/Schema';
import { eq, and, or } from 'drizzle-orm';
import { verifyIdToken } from '@/libs/FirebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.dbUserId;

    // TODO: Get user's organizationId from database
    // For now, we'll return all system and private prompts
    const prompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(
        and(
          eq(moduleAiPromptsSchema.isActive, true),
          or(
            eq(moduleAiPromptsSchema.scope, 'system'),
            // eq(moduleAiPromptsSchema.organizationId, userOrgId),
            eq(moduleAiPromptsSchema.createdBy, userId)
          )
        )
      )
      .orderBy(moduleAiPromptsSchema.scope, moduleAiPromptsSchema.category, moduleAiPromptsSchema.name);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.dbUserId;

    const body = await request.json();
    const { name, promptText, description, category, icon } = body;

    // Validate required fields
    if (!name || !promptText || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, promptText, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['analysis', 'creative', 'extraction', 'reflection'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Create new private prompt
    const [newPrompt] = await db
      .insert(moduleAiPromptsSchema)
      .values({
        name,
        promptText,
        description: description || null,
        category,
        icon: icon || 'sparkles',
        scope: 'private',
        organizationId: null, // Private prompts don't belong to an organization
        createdBy: userId,
        isActive: true,
        useCount: 0,
      })
      .returning();

    return NextResponse.json({ prompt: newPrompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}
