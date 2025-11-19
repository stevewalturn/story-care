/**
 * API Route: Therapist Prompts
 * GET: List all accessible prompts (system + org + private)
 * POST: Create new private prompt
 */

import type { NextRequest } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { moduleAiPromptsSchema, usersSchema } from '@/models/Schema';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user from database to get organizationId and user UUID
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'therapist') {
      return NextResponse.json({ error: 'Forbidden: Therapist access required' }, { status: 403 });
    }

    // Fetch system prompts + org prompts + private prompts
    const prompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(
        and(
          eq(moduleAiPromptsSchema.isActive, true),
          or(
            eq(moduleAiPromptsSchema.scope, 'system'),
            and(
              eq(moduleAiPromptsSchema.scope, 'organization'),
              eq(moduleAiPromptsSchema.organizationId, user.organizationId!),
            ),
            eq(moduleAiPromptsSchema.createdBy, user.id),
          ),
        ),
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
    const firebaseUid = decodedToken.uid;

    // Get user from database
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'therapist') {
      return NextResponse.json({ error: 'Forbidden: Therapist access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, promptText, description, category, icon } = body;

    // Validate required fields
    if (!name || !promptText || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, promptText, category' },
        { status: 400 },
      );
    }

    // Validate category
    const validCategories = ['analysis', 'creative', 'extraction', 'reflection'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 },
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
        createdBy: user.id,
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
