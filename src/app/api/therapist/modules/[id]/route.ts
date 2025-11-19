/**
 * Therapist Modules API - Individual Module
 * GET, PUT, DELETE operations for specific therapist private modules
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
 * GET /api/therapist/modules/[id]
 * Get specific module details (private modules only)
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

    // 2. AUTHORIZE - Therapist only
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Unauthorized. Therapist access required.' },
        { status: 403 },
      );
    }

    // 3. FETCH MODULE
    const { module: therapistModule, reflectionTemplates, surveyTemplates } = await getModuleById(
      resolvedParams.id,
    );

    // 4. VERIFY MODULE IS PRIVATE AND BELONGS TO THERAPIST
    if (therapistModule.scope !== 'private') {
      return NextResponse.json(
        { error: 'Can only access private modules' },
        { status: 403 },
      );
    }

    if (therapistModule.createdBy !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      module: therapistModule,
      reflectionTemplates,
      surveyTemplates,
    });
  } catch (error: any) {
    console.error('[Therapist] Get module error:', error);

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
 * PUT /api/therapist/modules/[id]
 * Update therapist private module
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

    // 2. AUTHORIZE - Therapist only
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Unauthorized. Therapist access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY MODULE EXISTS AND BELONGS TO THERAPIST
    const { module: therapistModule } = await getModuleById(resolvedParams.id);

    if (therapistModule.scope !== 'private') {
      return NextResponse.json(
        { error: 'Can only update private modules' },
        { status: 403 },
      );
    }

    if (therapistModule.createdBy !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    // 4. VALIDATE REQUEST BODY
    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    // 5. UPDATE MODULE (template IDs are now arrays)
    const updatedModule = await updateModule(resolvedParams.id, {
      name: validatedData.name,
      description: validatedData.description,
      reflectionTemplateIds: validatedData.reflectionTemplateIds,
      surveyTemplateIds: validatedData.surveyTemplateIds,
      aiPromptText: validatedData.aiPromptText,
      aiPromptMetadata: validatedData.aiPromptMetadata,
      status: validatedData.status,
    });

    return NextResponse.json({
      module: updatedModule,
      message: 'Module updated successfully',
    });
  } catch (error: any) {
    console.error('[Therapist] Update module error:', error);

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
 * DELETE /api/therapist/modules/[id]
 * Archive therapist private module (soft delete)
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

    // 2. AUTHORIZE - Therapist only
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Unauthorized. Therapist access required.' },
        { status: 403 },
      );
    }

    // 3. VERIFY MODULE EXISTS AND BELONGS TO THERAPIST
    const { module: therapistModule } = await getModuleById(resolvedParams.id);

    if (therapistModule.scope !== 'private') {
      return NextResponse.json(
        { error: 'Can only archive private modules' },
        { status: 403 },
      );
    }

    if (therapistModule.createdBy !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Module not found or access denied' },
        { status: 404 },
      );
    }

    // 4. ARCHIVE MODULE
    await archiveModule(resolvedParams.id);

    return NextResponse.json({
      message: 'Module archived successfully',
    });
  } catch (error: any) {
    console.error('[Therapist] Archive module error:', error);

    if (error.message === 'Module not found') {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to archive module' },
      { status: 500 },
    );
  }
}
