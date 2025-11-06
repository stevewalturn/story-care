/**
 * Organization API Routes for Org Admin
 * Allows org_admin to view and update their own organization
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import {
  handleRBACError,
  requireOrgAdmin,
} from '@/middleware/RBACMiddleware';
import { organizations as organizationsSchema } from '@/models/Schema';

/**
 * GET /api/org-admin/organization - Get own organization details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);

    console.error('GET /api/org-admin/organization - Fetching organization for org_admin:', {
      userId: user.id,
      organizationId: user.organizationId,
    });

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found for user' },
        { status: 404 },
      );
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsSchema.id, user.organizationId),
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    console.error('GET /api/org-admin/organization - Organization found:', {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('GET /api/org-admin/organization - Error:', error);
    return handleRBACError(error);
  }
}

/**
 * PATCH /api/org-admin/organization - Update own organization
 * org_admin can only update: name, contactEmail
 */
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contactEmail: z.string().email().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);

    console.error('PATCH /api/org-admin/organization - Update request from org_admin:', {
      userId: user.id,
      organizationId: user.organizationId,
    });

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found for user' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = updateOrganizationSchema.parse(body);

    console.error('PATCH /api/org-admin/organization - Validated update data:', validated);

    // Check if organization exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizationsSchema.id, user.organizationId),
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // Update organization
    const [updatedOrganization] = await db
      .update(organizationsSchema)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(organizationsSchema.id, user.organizationId))
      .returning();

    console.error('PATCH /api/org-admin/organization - Organization updated successfully:', {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('PATCH /api/org-admin/organization - Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return handleRBACError(error);
  }
}
