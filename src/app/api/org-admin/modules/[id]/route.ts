/**
 * Organization Admin Modules API - Individual Module
 * GET, PUT, DELETE operations for specific organization modules
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  archiveModule,
  getModuleById,
  updateModule,
} from '@/services/ModuleService';
import { requireAuth } from '@/utils/AuthHelpers';
import { updateModuleSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/org-admin/modules/[id]
 * Get specific module details
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

    // 2. AUTHORIZE - Org Admin only
    if (user.role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Organization admin access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY USER HAS ORGANIZATION
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 400 },
      );
    }

    // 4. FETCH MODULE
    const { module, reflectionTemplate, surveyTemplate } = await getModuleById(
      resolvedParams.id,
    );

    // 5. VERIFY MODULE BELONGS TO ORG (or is system template)
    if (
      module.scope === 'organization'
      && module.organizationId !== user.organizationId
    ) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    if (module.scope === 'private') {
      return NextResponse.json(
        { error: 'Cannot access private modules' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      module,
      reflectionTemplate,
      surveyTemplate,
    });
  } catch (error: any) {
    console.error('[Org Admin] Get module error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch module' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/org-admin/modules/[id]
 * Update organization module
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

    // 2. AUTHORIZE - Org Admin only
    if (user.role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Organization admin access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY USER HAS ORGANIZATION
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 400 },
      );
    }

    // 4. VERIFY MODULE EXISTS AND BELONGS TO ORG
    const { module } = await getModuleById(resolvedParams.id);

    if (module.scope !== 'organization') {
      return NextResponse.json(
        { error: 'Can only update organization modules' },
        { status: 403 },
      );
    }

    if (module.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    // 5. VALIDATE REQUEST BODY
    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    // 6. UPDATE MODULE
    const updatedModule = await updateModule(resolvedParams.id, {
      name: validatedData.name,
      description: validatedData.description,
      inSessionQuestions: validatedData.inSessionQuestions,
      reflectionTemplateId: validatedData.reflectionTemplateId || null,
      surveyTemplateId: validatedData.surveyTemplateId || null,
      aiPromptText: validatedData.aiPromptText,
      aiPromptMetadata: validatedData.aiPromptMetadata,
      status: validatedData.status,
    });

    return NextResponse.json({
      module: updatedModule,
      message: 'Module updated successfully',
    });
  } catch (error: any) {
    console.error('[Org Admin] Update module error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update module' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/org-admin/modules/[id]
 * Archive organization module (soft delete)
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

    // 2. AUTHORIZE - Org Admin only
    if (user.role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Organization admin access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY USER HAS ORGANIZATION
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 400 },
      );
    }

    // 4. VERIFY MODULE EXISTS AND BELONGS TO ORG
    const { module } = await getModuleById(resolvedParams.id);

    if (module.scope !== 'organization') {
      return NextResponse.json(
        { error: 'Can only archive organization modules' },
        { status: 403 },
      );
    }

    if (module.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    // 5. ARCHIVE MODULE
    await archiveModule(resolvedParams.id);

    return NextResponse.json({
      message: 'Module archived successfully',
    });
  } catch (error: any) {
    console.error('[Org Admin] Archive module error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to archive module' },
      { status: 500 },
    );
  }
}
