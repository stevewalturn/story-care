/**
 * Treatment Modules API
 * CRUD operations for treatment modules
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createModule, listModules } from '@/services/ModuleService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { createModuleSchema } from '@/validations/ModuleValidation';

/**
 * GET /api/modules - List treatment modules
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as any;
    const domain = searchParams.get('domain') as any;
    const status = searchParams.get('status') as any;

    const modules = await listModules({
      userId: user.dbUserId,
      organizationId: user.organizationId,
      scope,
      domain,
      status,
    });

    return NextResponse.json({ modules });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/modules - Create treatment module
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Authorization: Only admins and therapists can create modules
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot create modules' },
        { status: 403 },
      );
    }

    // Super admins can create system modules
    // Org admins can create organization modules
    // Therapists can create private modules
    const body = await request.json();
    const validated = createModuleSchema.parse(body);

    // Validate scope based on role
    if (validated.scope === 'system' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can create system modules' },
        { status: 403 },
      );
    }

    if (validated.scope === 'organization' && !['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create organization modules' },
        { status: 403 },
      );
    }

    const newModule = await createModule({
      ...validated,
      createdBy: user.dbUserId,
      organizationId: validated.scope === 'private' ? null : user.organizationId,
    });

    return NextResponse.json({ module: newModule }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
