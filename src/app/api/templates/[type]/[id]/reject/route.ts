/**
 * Template Rejection API
 * Org Admin can reject pending templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import { rejectTemplateSchema } from '@/validations/TemplateValidation';
import {
  rejectSurveyTemplate,
  rejectReflectionTemplate,
} from '@/services/TemplateService';

/**
 * POST /api/templates/[type]/[id]/reject - Reject template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    await requireOrgAdmin(request);
    const { type, id } = await params;

    if (type !== 'surveys' && type !== 'reflections') {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { reason } = rejectTemplateSchema.parse(body);

    const template =
      type === 'surveys'
        ? await rejectSurveyTemplate(id, reason)
        : await rejectReflectionTemplate(id, reason);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
