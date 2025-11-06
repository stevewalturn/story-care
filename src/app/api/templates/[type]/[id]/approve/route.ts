/**
 * Template Approval API
 * Org Admin can approve pending templates
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleRBACError, requireOrgAdmin } from '@/middleware/RBACMiddleware';
import {
  approveReflectionTemplate,
  approveSurveyTemplate,
} from '@/services/TemplateService';

/**
 * POST /api/templates/[type]/[id]/approve - Approve template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const user = await requireOrgAdmin(request);
    const { type, id } = await params;

    if (type !== 'surveys' && type !== 'reflections') {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 },
      );
    }

    const template
      = type === 'surveys'
        ? await approveSurveyTemplate(id, user.dbUserId)
        : await approveReflectionTemplate(id, user.dbUserId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    return handleRBACError(error);
  }
}
