/**
 * Organizations API Routes
 * Super Admin only - manage organizations
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
import {
  createOrganization,
  listOrganizations,
} from '@/services/OrganizationService';
import {
  createOrganizationSchema,
} from '@/validations/OrganizationValidation';

/**
 * GET /api/organizations - List all organizations (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'active'
      | 'suspended'
      | null;
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);

    const result = await listOrganizations({
      status: status || undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRBACError(error);
  }
}

/**
 * POST /api/organizations - Create organization (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdmin(request);

    console.error('POST /api/organizations - Super Admin authenticated:', {
      userId: user.dbUserId,
      dbUserId: user.dbUserId,
      email: user.email,
      role: user.role,
    });

    const body = await request.json();
    console.error('POST /api/organizations - Request body:', body);

    const validated = createOrganizationSchema.parse(body);
    console.error('POST /api/organizations - Validation passed:', validated);

    const organizationData = {
      ...validated,
      createdBy: user.dbUserId,
    };
    console.error('POST /api/organizations - Creating organization with data:', organizationData);

    const result = await createOrganization(organizationData);

    console.error('POST /api/organizations - Organization created successfully:', {
      organizationId: result.organization.id,
      adminUserId: result.adminUser?.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/organizations - Error occurred:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
