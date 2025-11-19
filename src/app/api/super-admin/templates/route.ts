/**
 * Super Admin Templates API
 * GET: Fetch all system templates (reflection + survey)
 * POST: Create new system template
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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user and verify super_admin role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all system templates (both reflection and survey)
    const reflectionTemplates = await db
      .select()
      .from(reflectionTemplatesSchema)
      .where(eq(reflectionTemplatesSchema.scope, 'system'));

    const surveyTemplates = await db
      .select()
      .from(surveyTemplatesSchema)
      .where(eq(surveyTemplatesSchema.scope, 'system'));

    // Combine and add type field
    const templates = [
      ...reflectionTemplates.map(t => ({ ...t, type: 'reflection' as const })),
      ...surveyTemplates.map(t => ({ ...t, type: 'survey' as const })),
    ];

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get user and verify super_admin role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, description, category, questions } = body;

    if (!type || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create template in appropriate table
    const templateData = {
      title,
      description: description || null,
      category: category || 'custom',
      questions,
      scope: 'system' as const,
      createdBy: user.id,
      status: 'active' as const,
      useCount: 0,
    };

    let newTemplate;

    if (type === 'reflection') {
      [newTemplate] = await db
        .insert(reflectionTemplatesSchema)
        .values(templateData)
        .returning();
    } else if (type === 'survey') {
      [newTemplate] = await db
        .insert(surveyTemplatesSchema)
        .values(templateData)
        .returning();
    } else {
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    return NextResponse.json({
      template: { ...newTemplate, type },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 },
    );
  }
}
