/**
 * Therapist Modules API
 * Manages therapist-scoped private treatment modules
 */

import type { NextRequest } from 'next/server';
import type { TherapeuticDomain } from '@/services/ModuleService';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/libs/FirebaseAdmin';
import {
  createTherapistModule,
  listOrgModules,
  listTemplates,
  listTherapistModules,

} from '@/services/ModuleService';
import { ModuleCreateSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/therapist/modules
 * List therapist private modules + available templates and org modules
 */
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Therapist only
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Unauthorized. Therapist access required.' },
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
    const includeTemplates = searchParams.get('includeTemplates') !== 'false'; // Default true
    const includeOrgModules = searchParams.get('includeOrgModules') !== 'false'; // Default true

    // 4. FETCH THERAPIST'S PRIVATE MODULES
    const privateModules = await listTherapistModules(user.uid, {
      domain: domain || undefined,
      status: status || undefined,
    });

    // 5. FETCH SYSTEM TEMPLATES (if requested)
    let templates: any[] = [];
    if (includeTemplates) {
      templates = await listTemplates({
        domain: domain || undefined,
        status: 'active', // Only show active templates
      });
    }

    // 6. FETCH ORG MODULES (if requested and therapist has organization)
    let orgModules: any[] = [];
    if (includeOrgModules && user.organizationId) {
      orgModules = await listOrgModules(user.organizationId, {
        domain: domain || undefined,
        status: 'active', // Only show active org modules
      });
    }

    return NextResponse.json({
      privateModules,
      templates,
      orgModules,
      privateCount: privateModules.length,
      templateCount: templates.length,
      orgCount: orgModules.length,
    });
  } catch (error: any) {
    console.error('[Therapist] List modules error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list modules' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/therapist/modules
 * Create new therapist private module
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireAuth(request);

    // 2. AUTHORIZE - Therapist only
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Unauthorized. Therapist access required.' },
        { status: 403 },
      );
    }

    // 3. VALIDATE REQUEST BODY
    const body = await request.json();
    const validatedData = ModuleCreateSchema.parse(body);

    // 4. CREATE PRIVATE MODULE
    const module = await createTherapistModule({
      name: validatedData.name,
      domain: validatedData.domain as TherapeuticDomain,
      description: validatedData.description,
      therapistId: user.uid,
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
        message: 'Private module created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[Therapist] Create module error:', error);

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
