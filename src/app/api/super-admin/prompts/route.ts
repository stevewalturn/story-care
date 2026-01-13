/**
 * API Route: Super Admin Prompts
 * GET: List all prompts (system + org + private for analytics)
 * POST: Create new system prompt
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { moduleAiPromptsSchema, usersSchema } from '@/models/Schema';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Verify role - query by firebaseUid, not id
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    // Get scope filter from query params
    const { searchParams } = new URL(request.url);
    const scopeFilter = searchParams.get('scope');

    // Default to system scope - super admin page should only show system prompts
    const scope = scopeFilter && ['system', 'organization', 'private'].includes(scopeFilter)
      ? scopeFilter
      : 'system';

    const prompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.scope, scope as any))
      .orderBy(
        moduleAiPromptsSchema.category,
        moduleAiPromptsSchema.name,
      );

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
    const firebaseUid = decodedToken.uid;

    // Verify role - query by firebaseUid, not id
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, promptText, description, category, icon, outputType, jsonSchema, blocks, useAdvancedMode } = body;

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

    // Validate outputType
    if (outputType && !['text', 'json'].includes(outputType)) {
      return NextResponse.json(
        { error: 'Invalid outputType. Must be text or json' },
        { status: 400 },
      );
    }

    // Validate jsonSchema is valid JSON if provided
    if (jsonSchema) {
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

    // Create new system prompt
    const [newPrompt] = await db
      .insert(moduleAiPromptsSchema)
      .values({
        name,
        promptText,
        description: description || null,
        category,
        icon: icon || 'sparkles',
        outputType: outputType || 'text',
        jsonSchema: jsonSchema || null,
        blocks: blocks || null,
        useAdvancedMode: useAdvancedMode || false,
        scope: 'system',
        organizationId: null, // System prompts don't belong to an organization
        createdBy: user.id, // Use database UUID, not Firebase UID
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
