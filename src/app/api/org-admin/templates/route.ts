/**
 * Org Admin Templates API
 * GET: Fetch organization templates + system templates
 * POST: Create new organization template
 */

import { eq, or } from 'drizzle-orm';
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

    // Get user and verify org_admin role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const includeSystem = url.searchParams.get('includeSystem') === 'true';

    // Fetch organization templates (created by users in this org)
    const orgReflectionTemplates = await db
      .select()
      .from(reflectionTemplatesSchema)
      .where(
        or(
          eq(reflectionTemplatesSchema.scope, 'organization'),
          eq(reflectionTemplatesSchema.createdBy, user.id),
        ),
      );

    const orgSurveyTemplates = await db
      .select()
      .from(surveyTemplatesSchema)
      .where(
        or(
          eq(surveyTemplatesSchema.scope, 'organization'),
          eq(surveyTemplatesSchema.createdBy, user.id),
        ),
      );

    const templates = [
      ...orgReflectionTemplates.map(t => ({ ...t, type: 'reflection' as const })),
      ...orgSurveyTemplates.map(t => ({ ...t, type: 'survey' as const })),
    ];

    let systemTemplates: any[] = [];
    if (includeSystem) {
      // Fetch system templates
      const sysReflectionTemplates = await db
        .select()
        .from(reflectionTemplatesSchema)
        .where(eq(reflectionTemplatesSchema.scope, 'system'));

      const sysSurveyTemplates = await db
        .select()
        .from(surveyTemplatesSchema)
        .where(eq(surveyTemplatesSchema.scope, 'system'));

      systemTemplates = [
        ...sysReflectionTemplates.map(t => ({ ...t, type: 'reflection' as const })),
        ...sysSurveyTemplates.map(t => ({ ...t, type: 'survey' as const })),
      ];
    }

    return NextResponse.json({ templates, systemTemplates });
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

    // Get user and verify org_admin role
    const user = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.firebaseUid, firebaseUid),
    });

    if (!user || user.role !== 'org_admin') {
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
      scope: 'organization' as const,
      organizationId: user.organizationId,
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
