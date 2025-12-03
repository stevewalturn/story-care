/**
 * Super Admin Module Templates API
 * Manages system-scoped treatment module templates
 */

import type { NextRequest } from 'next/server';
import type { TherapeuticDomain } from '@/services/ModuleService';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createTemplate,
  listTemplates,
  updateModulePromptLinks,
} from '@/services/ModuleService';
import { requireAuth } from '@/utils/AuthHelpers';
import { createModuleSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/super-admin/module-templates
 * List all system templates
 */
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Super Admin only
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 },
      );
    }

    // 3. PARSE QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as TherapeuticDomain | null;
    const status = searchParams.get('status') as
      | 'active'
      | 'archived'
      | 'pending_approval'
      | null;

    // 4. FETCH TEMPLATES
    const templates = await listTemplates({
      domain: domain || undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('[Super Admin] List templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list templates' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/super-admin/module-templates
 * Create new system template
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Super Admin only
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 },
      );
    }

    // 3. VALIDATE REQUEST BODY
    const body = await request.json();
    const validatedData = createModuleSchema.parse(body);

    // 4. CREATE TEMPLATE
    const template = await createTemplate({
      name: validatedData.name,
      domain: validatedData.domain as TherapeuticDomain,
      description: validatedData.description,
      createdBy: user.dbUserId,
      aiPromptText: validatedData.aiPromptText,
      aiPromptMetadata: validatedData.aiPromptMetadata,
    });

    // 5. LINK AI PROMPTS from library (via junction table)
    if (template && validatedData.linkedPromptIds && validatedData.linkedPromptIds.length > 0) {
      await updateModulePromptLinks(template.id, validatedData.linkedPromptIds);
    }

    return NextResponse.json(
      {
        template,
        message: 'System template created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[Super Admin] Create template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 },
    );
  }
}
