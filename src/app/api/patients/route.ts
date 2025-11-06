/**
 * Patients API
 * Manage patient accounts within an organization
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { and, eq, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/patients - List patients in the authenticated user's organization
 *
 * Query Parameters:
 * - search: Filter by name (optional)
 * - therapistId: Filter by therapist Firebase UID (optional)
 *
 * Access Control:
 * - Org admins: See all patients in their organization
 * - Therapists: See only their assigned patients
 * - Super admins: See all patients across all organizations
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const therapistFirebaseUid = searchParams.get('therapistId');

    // Build query conditions
    const conditions = [eq(users.role, 'patient')];

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      // Org admins can only see patients in their organization
      if (!authUser.organizationId) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 },
        );
      }
      conditions.push(eq(users.organizationId, authUser.organizationId));
    } else if (authUser.role === 'therapist') {
      // Therapists can only see their assigned patients
      conditions.push(eq(users.therapistId, authUser.dbUserId));

      // If therapist also filters by therapistId, ensure it's their own ID
      if (therapistFirebaseUid && therapistFirebaseUid !== authUser.uid) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access other therapists\' patients' },
          { status: 403 },
        );
      }
    } else if (authUser.role === 'patient') {
      // Patients shouldn't access this endpoint
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 },
      );
    }
    // Super admins can see all patients (no org filter)

    // Search filter
    if (search) {
      conditions.push(ilike(users.name, `%${search}%`));
    }

    // Therapist filter (for org admins filtering by specific therapist)
    if (therapistFirebaseUid && authUser.role === 'org_admin') {
      const [therapist] = await db
        .select({ id: users.id, organizationId: users.organizationId })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (therapist) {
        // Ensure therapist is in the same organization
        if (therapist.organizationId !== authUser.organizationId) {
          return NextResponse.json(
            { error: 'Forbidden: Therapist not in your organization' },
            { status: 403 },
          );
        }
        conditions.push(eq(users.therapistId, therapist.id));
      } else {
        // Therapist not found, return empty array
        return NextResponse.json({ patients: [] });
      }
    }

    // Fetch patients
    const patientsList = await db
      .select()
      .from(users)
      .where(and(...conditions));

    return NextResponse.json({ patients: patientsList });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return handleAuthError(error);
  }
}

/**
 * POST /api/patients - Create a new patient
 *
 * Request Body:
 * - name: Patient name (required)
 * - email: Patient email (optional)
 * - referenceImageUrl: Patient avatar/reference image (optional)
 * - therapistId: Therapist Firebase UID (required)
 *
 * Access Control:
 * - Therapists: Can create patients assigned to themselves
 * - Org admins: Can create patients assigned to any therapist in their org
 * - Super admins: Can create patients in any organization
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const body = await request.json();
    const {
      name,
      email,
      referenceImageUrl,
      therapistId: therapistFirebaseUid,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      );
    }

    if (!therapistFirebaseUid) {
      return NextResponse.json(
        { error: 'Therapist ID is required' },
        { status: 400 },
      );
    }

    // Fetch therapist to get database UUID and organizationId
    const [therapist] = await db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.firebaseUid, therapistFirebaseUid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Access control: Ensure user can create patients for this therapist
    if (authUser.role === 'therapist') {
      // Therapists can only create patients for themselves
      if (authUser.dbUserId !== therapist.id) {
        return NextResponse.json(
          { error: 'Forbidden: Can only create patients assigned to yourself' },
          { status: 403 },
        );
      }
    } else if (authUser.role === 'org_admin') {
      // Org admins can only create patients for therapists in their org
      if (authUser.organizationId !== therapist.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Therapist not in your organization' },
          { status: 403 },
        );
      }
    }
    // Super admins can create patients for any therapist

    // Create patient - IMPORTANT: Inherit organizationId from therapist
    const patientResult = await db
      .insert(users)
      .values({
        name,
        email: email || null,
        avatarUrl: referenceImageUrl || null,
        role: 'patient',
        therapistId: therapist.id, // Link to therapist (database UUID)
        organizationId: therapist.organizationId, // Inherit organization from therapist
        status: 'active', // Patients are active by default (therapist already invited them)
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const patient = Array.isArray(patientResult) && patientResult.length > 0 ? patientResult[0] : null;

    if (!patient) {
      return NextResponse.json(
        { error: 'Failed to create patient' },
        { status: 500 },
      );
    }

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Failed to create patient:', error);
    return handleAuthError(error);
  }
}
