/**
 * Therapists API
 * Manage therapist accounts within an organization
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { and, count, eq, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { handleAuthError, requireAdmin, requireAuth } from '@/utils/AuthHelpers';
import { inviteTherapistSchema } from '@/validations/UserValidation';

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

/**
 * POST /api/therapists - Invite a therapist to the organization
 *
 * Request Body:
 * - name: Therapist name (required)
 * - email: Therapist email (required)
 * - licenseNumber: Professional license number (optional)
 * - specialty: Therapist specialty (optional)
 *
 * Access Control:
 * - Org admins: Can invite therapists to their organization
 * - Super admins: Can invite therapists to any organization
 *
 * Flow:
 * 1. Creates therapist with status='invited', firebaseUid=null
 * 2. Therapist receives invitation (email integration pending)
 * 3. When therapist signs in, firebaseUid is linked and status becomes 'active'
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);

    const body = await request.json();
    const validated = inviteTherapistSchema.parse(body);

    // Check if email already exists in the organization
    const existingUser = await db.query.users.findFirst({
      where: (users, { and, eq }) => {
        const conditions = [eq(users.email, validated.email)];

        // For org admins, check within their organization only
        if (authUser.role === 'org_admin' && authUser.organizationId) {
          conditions.push(eq(users.organizationId, authUser.organizationId));
        }

        return and(...conditions);
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: authUser.role === 'org_admin'
            ? 'A user with this email already exists in your organization'
            : 'A user with this email already exists',
        },
        { status: 409 },
      );
    }

    // Org admins must have an organization
    if (authUser.role === 'org_admin' && !authUser.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 },
      );
    }

    // Create invited therapist
    const [therapist] = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        licenseNumber: validated.licenseNumber || null,
        specialty: validated.specialty || null,
        role: 'therapist',
        organizationId: authUser.organizationId, // null for super_admin is OK
        status: 'invited', // Will be activated when they sign in
        firebaseUid: null, // Will be linked when they sign in
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!therapist) {
      return NextResponse.json(
        { error: 'Failed to create therapist' },
        { status: 500 },
      );
    }

    // Note: No email is sent. Therapist signs in at /sign-in using their invited email.
    // The system will auto-link their Firebase UID and activate their account.

    return NextResponse.json(
      {
        therapist,
        message: `Therapist invited! They can now sign in using ${validated.email}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to invite therapist:', error);
    return handleAuthError(error);
  }
}
