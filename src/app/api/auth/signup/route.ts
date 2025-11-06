/**
 * Self-Signup API
 * Users can signup with organization code
 * Creates pending user awaiting org admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeRegistrationSchema } from '@/validations/AuthValidation';
import { verifyJoinCode } from '@/services/OrganizationService';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

/**
 * POST /api/auth/signup - Self-signup with organization code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = completeRegistrationSchema.parse(body);

    // Verify Firebase UID doesn't already exist
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.firebaseUid, validated.firebaseUid),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    // Verify organization exists and is active
    const org = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.id, validated.organizationId),
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    if (org.status !== 'active' && org.status !== 'trial') {
      return NextResponse.json(
        { error: 'Organization is not active' },
        { status: 400 },
      );
    }

    // Create pending user
    const [newUser] = await db
      .insert(users)
      .values({
        firebaseUid: validated.firebaseUid,
        name: validated.name,
        email: validated.email,
        organizationId: validated.organizationId,
        role: validated.role,
        status: 'pending_approval',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // TODO: Send notification to org admin about pending user
    // TODO: Send confirmation email to user

    return NextResponse.json(
      {
        success: true,
        userId: newUser.id,
        status: 'pending_approval',
        message: 'Your registration is pending approval from your organization admin',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup' },
      { status: 500 },
    );
  }
}
