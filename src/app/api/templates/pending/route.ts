/**
 * Pending Templates API
 * Org Admin can list pending templates for approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import {
  getPendingSurveyTemplates,
  getPendingReflectionTemplates,
} from '@/services/TemplateService';

/**
 * GET /api/templates/pending - List pending templates
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'survey' | 'reflection' | null (both)

    const surveys =
      type === 'reflection'
        ? []
        : await getPendingSurveyTemplates(user.organizationId);

    const reflections =
      type === 'survey'
        ? []
        : await getPendingReflectionTemplates(user.organizationId);

    return NextResponse.json({
      surveys,
      reflections,
      total: surveys.length + reflections.length,
    });
  } catch (error) {
    return handleRBACError(error);
  }
}
