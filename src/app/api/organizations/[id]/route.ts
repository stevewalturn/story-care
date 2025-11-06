/**
 * Organization Detail API Routes
 * Super Admin only - manage specific organization
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  requireSuperAdmin,
  handleRBACError,
} from '@/middleware/RBACMiddleware';
import { updateOrganizationSchema } from '@/validations/OrganizationValidation';
import {
  getOrganizationWithMetrics,
  updateOrganization,
  deleteOrganization,
} from '@/services/OrganizationService';

/**
 * GET /api/organizations/[id] - Get organization details with metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin(request);

    const { id } = await params;
    const organization = await getOrganizationWithMetrics(id);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    return handleRBACError(error);
  }
}

/**
 * PATCH /api/organizations/[id] - Update organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const validated = updateOrganizationSchema.parse(body);

    const organization = await updateOrganization(id, {
      ...validated,
      trialEndsAt:
        validated.trialEndsAt !== undefined
          ? validated.trialEndsAt
            ? new Date(validated.trialEndsAt)
            : null
          : undefined,
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}

/**
 * DELETE /api/organizations/[id] - Delete organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin(request);

    const { id } = await params;
    const deleted = await deleteOrganization(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRBACError(error);
  }
}
