/**
 * Resend Patient Invitation API
 * Resend invitation email to a pending patient
 * HIPAA Compliant: Requires authentication and organization boundary enforcement
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { users } from '@/models/Schema';
import { sendPatientInvitationEmail } from '@/services/EmailService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * POST /api/patients/[id]/resend-invitation - Resend invitation to a patient
 *
 * Access Control:
 * - Therapists: Can resend invitations to their own patients
 * - Org admins: Can resend invitations to patients in their organization
 * - Super admins: Can resend invitations to any patient
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // HIPAA: Require authentication
    const authUser = await requireAuth(request);

    const patientId = params.id;

    // Fetch patient
    const [patient] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        firebaseUid: users.firebaseUid,
        organizationId: users.organizationId,
        therapistId: users.therapistId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 },
      );
    }

    if (patient.role !== 'patient') {
      return NextResponse.json(
        { error: 'User is not a patient' },
        { status: 400 },
      );
    }

    // Access control
    if (authUser.role === 'therapist') {
      // Therapists can only resend for their own patients
      if (authUser.dbUserId !== patient.therapistId) {
        return NextResponse.json(
          { error: 'Forbidden: Patient not assigned to you' },
          { status: 403 },
        );
      }
    } else if (authUser.role === 'org_admin') {
      // Org admins can only resend for patients in their organization
      if (!authUser.organizationId || authUser.organizationId !== patient.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Patient not in your organization' },
          { status: 403 },
        );
      }
    }
    // Super admins can resend for any patient

    // Verify patient is in 'invited' status
    if (patient.status !== 'invited') {
      return NextResponse.json(
        { error: `Cannot resend invitation. Patient status is '${patient.status}' (expected 'invited')` },
        { status: 400 },
      );
    }

    // Verify firebaseUid is null (not yet activated)
    if (patient.firebaseUid) {
      return NextResponse.json(
        { error: 'Cannot resend invitation. Patient has already activated their account' },
        { status: 400 },
      );
    }

    // Verify patient has email
    if (!patient.email) {
      return NextResponse.json(
        { error: 'Cannot resend invitation. Patient does not have an email address' },
        { status: 400 },
      );
    }

    // Fetch therapist details for email
    if (!patient.therapistId) {
      return NextResponse.json(
        { error: 'Cannot resend invitation. Patient has no assigned therapist' },
        { status: 400 },
      );
    }

    const [therapist] = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, patient.therapistId))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Construct setup account URL
    const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const setupAccountUrl = `${appUrl}/setup-account?email=${encodeURIComponent(patient.email)}&type=patient`;

    // Resend invitation email
    try {
      await sendPatientInvitationEmail({
        patientEmail: patient.email,
        patientName: patient.name,
        patientUserId: patient.id,
        therapistName: therapist.name,
        therapistId: therapist.id,
        therapistAvatarUrl: therapist.avatarUrl || undefined,
        setupAccountUrl,
        welcomeMessage: undefined, // No custom message on resend
      });

      return NextResponse.json({
        success: true,
        message: `Invitation email resent successfully to ${patient.email}`,
      });
    } catch (error) {
      console.error('Failed to resend patient invitation email:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Failed to resend patient invitation:', error);
    return handleAuthError(error);
  }
}
