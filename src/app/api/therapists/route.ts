/**
 * Therapists API
 * Manage therapist accounts within an organization
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq, ilike } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/therapists - List therapists in the authenticated user's organization
 *
 * Query Parameters:
 * - search: Filter by name (optional)
 *
 * Access Control:
 * - Org admins: See all therapists in their organization
 * - Super admins: See all therapists across all organizations
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query conditions
    const conditions = [eq(users.role, 'therapist')];

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      // Org admins can only see therapists in their organization
      if (!authUser.organizationId) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 },
        );
      }
      conditions.push(eq(users.organizationId, authUser.organizationId));
    } else if (authUser.role === 'therapist' || authUser.role === 'patient') {
      // Therapists and patients shouldn't access this endpoint
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 },
      );
    }
    // Super admins can see all therapists (no org filter)

    // Search filter
    if (search) {
      conditions.push(ilike(users.name, `%${search}%`));
    }

    // Fetch therapists
    const therapists = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.name);

    // Get patient count for each therapist
    const therapistsWithCounts = await Promise.all(
      therapists.map(async (therapist) => {
        const patientCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.role, 'patient'),
              eq(users.therapistId, therapist.id),
            ),
          );

        return {
          ...therapist,
          patientCount: Number(patientCountResult[0]?.count || 0),
        };
      }),
    );

    return NextResponse.json({
      therapists: therapistsWithCounts,
      total: therapistsWithCounts.length,
    });
  } catch (error) {
    console.error('Failed to fetch therapists:', error);
    return handleAuthError(error);
  }
}
