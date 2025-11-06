/**
 * Organizations API Routes
 * Super Admin only - manage organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  requireSuperAdmin,
  handleRBACError,
} from '@/middleware/RBACMiddleware';
import {
  createOrganizationSchema,
  verifyOrgCodeSchema,
} from '@/validations/OrganizationValidation';
import {
  createOrganization,
  listOrganizations,
  verifyJoinCode,
  getPlatformMetrics,
} from '@/services/OrganizationService';

/**
 * GET /api/organizations - List all organizations (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'active'
      | 'trial'
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

    const organization = await createOrganization({
      ...validated,
      trialEndsAt: validated.trialEndsAt
        ? new Date(validated.trialEndsAt)
        : undefined,
      createdBy: user.dbUserId,
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}
