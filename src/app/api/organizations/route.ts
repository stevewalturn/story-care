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
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);

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

    const body = await request.json();
    const validated = createOrganizationSchema.parse(body);

    const result = await createOrganization({
      ...validated,
      createdBy: user.dbUserId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
