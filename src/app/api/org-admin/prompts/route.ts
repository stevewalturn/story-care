/**
 * API Route: Org Admin Prompts
 * GET: List all accessible prompts (system + org)
 * POST: Create new organization prompt
 */

import type { NextRequest } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
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

    // Get user's organization ID and verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden: Org admin access required' }, { status: 403 });
    }

    // Fetch system prompts + org prompts for this organization
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user's organization ID and verify role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden: Org admin access required' }, { status: 403 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 400 });
    }

    const body = await request.json();
    const { name, promptText, description, category, icon, outputType, jsonSchema } = body;

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

    // Create new organization prompt
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
        scope: 'organization',
        organizationId: user.organizationId,
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
