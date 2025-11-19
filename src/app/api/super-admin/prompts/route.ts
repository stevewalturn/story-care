/**
 * API Route: Super Admin Prompts
 * GET: List all prompts (system + org + private for analytics)
 * POST: Create new system prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { moduleAiPromptsSchema, usersSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { adminAuth } from '@/libs/FirebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.id, userId),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    // Get scope filter from query params
    const { searchParams } = new URL(request.url);
    const scopeFilter = searchParams.get('scope');

    let prompts;

    if (scopeFilter && ['system', 'organization', 'private'].includes(scopeFilter)) {
      prompts = await db
        .select()
        .from(moduleAiPromptsSchema)
        .where(eq(moduleAiPromptsSchema.scope, scopeFilter as any))
        .orderBy(
          moduleAiPromptsSchema.scope,
          moduleAiPromptsSchema.category,
          moduleAiPromptsSchema.name
        );
    } else {
      prompts = await db
        .select()
        .from(moduleAiPromptsSchema)
        .orderBy(
          moduleAiPromptsSchema.scope,
          moduleAiPromptsSchema.category,
          moduleAiPromptsSchema.name
        );
    }

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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.id, userId),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

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

    // Create new system prompt
    const [newPrompt] = await db
      .insert(moduleAiPromptsSchema)
      .values({
        name,
        promptText,
        description: description || null,
        category,
        icon: icon || 'sparkles',
        scope: 'system',
        organizationId: null, // System prompts don't belong to an organization
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
