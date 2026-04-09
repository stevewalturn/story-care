/**
 * Organization Detail API Routes
 * Super Admin only - manage specific organization
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  handleRBACError,
  requireSuperAdmin,
} from '@/middleware/RBACMiddleware';
import {
  archiveOrganization,
  getOrganizationWithMetrics,
  restoreOrganization,
  updateOrganization,
} from '@/services/OrganizationService';
import { updateOrganizationSchema } from '@/validations/OrganizationValidation';

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

    // Handle restore action
    if (body.action === 'restore') {
      const restored = await restoreOrganization(id);
      if (!restored) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 },
        );
      }
      return NextResponse.json({ organization: restored });
    }

    const validated = updateOrganizationSchema.parse(body);

    // Separate admin fields from organization fields
    const { adminEmail, adminName, adminPhone, ...orgData } = validated;

    const organization = await updateOrganization(id, orgData);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // If admin fields are provided, create admin user
    let adminUser = null;
    if (adminEmail && adminName) {
      const { db } = await import('@/libs/DB');
      const { users } = await import('@/models/Schema');

      const adminUserResult = await db
        .insert(users)
        .values({
          email: adminEmail,
          name: adminName,
          role: 'org_admin',
          organizationId: id,
          status: 'invited',
          firebaseUid: null,
          phoneNumber: adminPhone || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      adminUser = Array.isArray(adminUserResult) ? adminUserResult[0] : null;
    }

    return NextResponse.json({ organization, adminUser });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleRBACError(error);
  }
}

/**
 * DELETE /api/organizations/[id] - Archive organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin(request);

    const { id } = await params;
    const archived = await archiveOrganization(id);

    if (!archived) {
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
