/**
 * Organization Join Code Management API
 * Super Admin and Org Admin can manage join codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgAdmin, handleRBACError } from '@/middleware/RBACMiddleware';
import {
  regenerateJoinCode,
  toggleJoinCode,
} from '@/services/OrganizationService';

/**
 * POST /api/organizations/[id]/join-code - Regenerate join code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireOrgAdmin(request);
    const { id } = await params;

    // Ensure user can only manage their own org (unless super admin)
    if (user.role !== 'super_admin' && user.organizationId !== id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only manage your own organization' },
        { status: 403 },
      );
    }

    const organization = await regenerateJoinCode(id);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      joinCode: organization.joinCode,
    });
  } catch (error) {
    return handleRBACError(error);
  }
}

/**
 * PATCH /api/organizations/[id]/join-code - Toggle join code enabled
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireOrgAdmin(request);
    const { id } = await params;

    // Ensure user can only manage their own org (unless super admin)
    if (user.role !== 'super_admin' && user.organizationId !== id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only manage your own organization' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 },
      );
    }

    const organization = await toggleJoinCode(id, enabled);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      joinCodeEnabled: organization.joinCodeEnabled,
    });
  } catch (error) {
    return handleRBACError(error);
  }
}
