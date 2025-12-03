/**
 * Therapist Template by ID API
 * GET: Fetch a single template by ID
 */

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import {
  reflectionTemplatesSchema,
  surveyTemplatesSchema,
  usersSchema,
} from '@/models/Schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Try to find in reflection templates first
    let template = await db.query.reflectionTemplatesSchema.findFirst({
      where: eq(reflectionTemplatesSchema.id, id),
    });

    let templateType: 'reflection' | 'survey' = 'reflection';

    // If not found, try survey templates
    if (!template) {
      template = await db.query.surveyTemplatesSchema.findFirst({
        where: eq(surveyTemplatesSchema.id, id),
      });
      templateType = 'survey';
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check access permissions
    // User can access: system templates, org templates (if same org), or their own private templates
    const canAccess = template.scope === 'system'
      || (template.scope === 'organization' && template.organizationId === user.organizationId)
      || (template.scope === 'private' && template.createdBy === user.id);

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      template: { ...template, type: templateType },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 },
    );
  }
}

/**
 * PUT: Update an existing private template
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, questions } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 },
      );
    }

    // Try to find in reflection templates first
    let template = await db.query.reflectionTemplatesSchema.findFirst({
      where: eq(reflectionTemplatesSchema.id, id),
    });

    let isReflection = true;

    // If not found, try survey templates
    if (!template) {
      template = await db.query.surveyTemplatesSchema.findFirst({
        where: eq(surveyTemplatesSchema.id, id),
      });
      isReflection = false;
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user owns this template (can only edit own private templates)
    if (template.scope !== 'private' || template.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own private templates' },
        { status: 403 },
      );
    }

    // Update the template
    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      category,
      questions,
      updatedAt: new Date(),
    };

    let updatedTemplate;
    if (isReflection) {
      [updatedTemplate] = await db
        .update(reflectionTemplatesSchema)
        .set(updateData)
        .where(eq(reflectionTemplatesSchema.id, id))
        .returning();
    }
    else {
      [updatedTemplate] = await db
        .update(surveyTemplatesSchema)
        .set(updateData)
        .where(eq(surveyTemplatesSchema.id, id))
        .returning();
    }

    return NextResponse.json({
      template: { ...updatedTemplate, type: isReflection ? 'reflection' : 'survey' },
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 },
    );
  }
}
