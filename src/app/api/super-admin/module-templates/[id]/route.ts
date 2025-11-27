/**
 * Super Admin Module Templates API - Individual Template
 * GET, PUT, DELETE operations for specific system templates
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  archiveModule,
  getModuleById,
  updateModule,
  updateModulePromptLinks,
} from '@/services/ModuleService';
import { requireAuth } from '@/utils/AuthHelpers';
import { updateModuleSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/super-admin/module-templates/[id]
 * Get specific template details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 0. RESOLVE PARAMS (Next.js 15+ async params)
    const resolvedParams = await params;

    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Super Admin only
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 },
      );
    }

    // 3. FETCH TEMPLATE
    const { module: templateModule, reflectionTemplates, surveyTemplates } = await getModuleById(
      resolvedParams.id,
    );

    // 4. VERIFY IT'S A SYSTEM TEMPLATE
    if (templateModule.scope !== 'system') {
      return NextResponse.json(
        { error: 'Template not found or not a system template' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: templateModule,
      reflectionTemplates,
      surveyTemplates,
    });
  } catch (error: any) {
    console.error('[Super Admin] Get template error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/super-admin/module-templates/[id]
 * Update system template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 0. RESOLVE PARAMS
    const resolvedParams = await params;

    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Super Admin only
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY TEMPLATE EXISTS AND IS SYSTEM SCOPE
    const { module: templateModule } = await getModuleById(resolvedParams.id);

    if (templateModule.scope !== 'system') {
      return NextResponse.json(
        { error: 'Can only update system templates' },
        { status: 403 },
      );
    }

    // 4. VALIDATE REQUEST BODY
    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    // 5. UPDATE TEMPLATE
    const updatedTemplate = await updateModule(resolvedParams.id, {
      name: validatedData.name,
      description: validatedData.description,

      reflectionTemplateIds: validatedData.reflectionTemplateIds,
      surveyTemplateIds: validatedData.surveyTemplateIds,
      aiPromptText: validatedData.aiPromptText,
      aiPromptMetadata: validatedData.aiPromptMetadata,
      status: validatedData.status,
    });

    // 6. UPDATE LINKED AI PROMPTS (if provided)
    if (validatedData.linkedPromptIds !== undefined) {
      await updateModulePromptLinks(resolvedParams.id, validatedData.linkedPromptIds);
    }

    return NextResponse.json({
      template: updatedTemplate,
      message: 'Template updated successfully',
    });
  } catch (error: any) {
    console.error('[Super Admin] Update template error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/super-admin/module-templates/[id]
 * Archive system template (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 0. RESOLVE PARAMS
    const resolvedParams = await params;

    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Super Admin only
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY TEMPLATE EXISTS AND IS SYSTEM SCOPE
    const { module: templateModule } = await getModuleById(resolvedParams.id);

    if (templateModule.scope !== 'system') {
      return NextResponse.json(
        { error: 'Can only archive system templates' },
        { status: 403 },
      );
    }

    // 4. ARCHIVE TEMPLATE
    await archiveModule(resolvedParams.id);

    return NextResponse.json({
      message: 'Template archived successfully',
    });
  } catch (error: any) {
    console.error('[Super Admin] Archive template error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to archive template' },
      { status: 500 },
    );
  }
}
