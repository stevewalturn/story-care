/**
 * Organization Admin Modules API
 * Manages organization-scoped treatment modules
 */

import type { NextRequest } from 'next/server';
import type { TherapeuticDomain } from '@/services/ModuleService';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/libs/FirebaseAdmin';
import {
  copyTemplateToOrg,
  createOrgModule,
  listOrgModules,
  listTemplates,

} from '@/services/ModuleService';
import { ModuleCreateSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/org-admin/modules
 * List organization modules + system templates
 */
export async function GET(request: NextRequest) {
  try {
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

    // 4. PARSE QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as TherapeuticDomain | null;
    const status = searchParams.get('status') as
      | 'active'
      | 'archived'
      | 'pending_approval'
      | null;
    const includeTemplates = searchParams.get('includeTemplates') !== 'false'; // Default true

    // 5. FETCH ORG MODULES
    const orgModules = await listOrgModules(user.organizationId, {
      domain: domain || undefined,
      status: status || undefined,
    });

    // 6. FETCH SYSTEM TEMPLATES (if requested)
    let templates: any[] = [];
    if (includeTemplates) {
      templates = await listTemplates({
        domain: domain || undefined,
        status: 'active', // Only show active templates
      });
    }

    return NextResponse.json({
      modules: orgModules,
      templates,
      orgCount: orgModules.length,
      templateCount: templates.length,
    });
  } catch (error: any) {
    console.error('[Org Admin] List modules error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list modules' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/org-admin/modules
 * Create new org module OR copy template
 */
export async function POST(request: NextRequest) {
  try {
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

    // 4. VALIDATE REQUEST BODY
    const body = await request.json();

    // Check if this is a template copy request
    if (body.copyFromTemplateId) {
      const { module, copiedFrom } = await copyTemplateToOrg(
        body.copyFromTemplateId,
        user.organizationId,
        user.uid,
        body.name, // Pass custom name if provided
      );

      return NextResponse.json(
        {
          module,
          message: 'Template copied to organization successfully',
          copiedFrom,
        },
        { status: 201 },
      );
    }

    // Otherwise, create new module from scratch
    const validatedData = ModuleCreateSchema.parse(body);

    const module = await createOrgModule({
      name: validatedData.name,
      domain: validatedData.domain as TherapeuticDomain,
      description: validatedData.description,
      organizationId: user.organizationId,
      createdBy: user.uid,
      inSessionQuestions: validatedData.inSessionQuestions,
      reflectionTemplateId: validatedData.reflectionTemplateId || null,
      surveyTemplateId: validatedData.surveyTemplateId || null,
      aiPromptText: validatedData.aiPromptText,
      aiPromptMetadata: validatedData.aiPromptMetadata,
    });

    return NextResponse.json(
      {
        module,
        message: 'Organization module created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[Org Admin] Create module error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create module' },
      { status: 500 },
    );
  }
}
