/**
 * Reflection Templates API
 * CRUD operations for reflection templates
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createReflectionTemplate,
  listReflectionTemplates,
} from '@/services/TemplateService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { createReflectionTemplateSchema } from '@/validations/TemplateValidation';

/**
 * GET /api/templates/reflections - List reflection templates
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as any;
    const status = searchParams.get('status') as any;

    const templates = await listReflectionTemplates({
      userId: user.dbUserId,
      organizationId: user.organizationId,
      scope,
      status,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/templates/reflections - Create reflection template
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Only therapists and admins can create templates
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot create templates' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = createReflectionTemplateSchema.parse(body);

    const template = await createReflectionTemplate({
      ...validated,
      createdBy: user.dbUserId,
      organizationId: validated.scope === 'private' ? null : user.organizationId,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
