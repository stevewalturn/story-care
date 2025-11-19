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
