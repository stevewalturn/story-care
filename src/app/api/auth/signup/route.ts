/**
 * Self-Signup API
 * Users can signup with organization code
 * Creates pending user awaiting org admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeRegistrationSchema } from '@/validations/AuthValidation';
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
    const existingUserByFirebase = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.firebaseUid, validated.firebaseUid),
    });

    if (existingUserByFirebase) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    // Check for existing user by email in organization
    const existingUserByEmail = await db.query.users.findFirst({
      where: (users, { and, eq }) => and(
        eq(users.email, validated.email),
        eq(users.organizationId, validated.organizationId)
      ),
    });

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

    if (org.status !== 'active') {
      return NextResponse.json(
        { error: 'Organization is not active' },
        { status: 400 },
      );
    }

    // If user exists by email, update instead of creating new
    if (existingUserByEmail) {
      // User already has Firebase account linked
      if (existingUserByEmail.firebaseUid !== null) {
        return NextResponse.json(
          { error: 'This email is already registered with a Firebase account' },
          { status: 409 },
        );
      }

      // Update pre-created user with Firebase UID
      const autoApprove = existingUserByEmail.role === 'org_admin';

      const updatedUsers = await db
        .update(users)
        .set({
          firebaseUid: validated.firebaseUid,
          name: validated.name,
          status: autoApprove ? 'active' : 'pending_approval',
          updatedAt: new Date(),
        })
        .where((u, { eq }) => eq(u.id, existingUserByEmail.id))
        .returning();

      if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
        throw new Error('Failed to update user');
      }

      const updatedUser = updatedUsers[0];

      return NextResponse.json(
        {
          success: true,
          userId: updatedUser.id,
          status: updatedUser.status,
          autoApproved: autoApprove,
          message: autoApprove
            ? 'Welcome! Your account has been automatically approved as organization administrator'
            : 'Your registration is pending approval from your organization admin',
        },
        { status: 200 },
      );
    }

    // Create new pending user
    const newUsers = await db
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

    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      throw new Error('Failed to create user');
    }

    const newUser = newUsers[0];

    // TODO: Send notification to org admin about pending user
    // TODO: Send confirmation email to user

    return NextResponse.json(
      {
        success: true,
        userId: newUser.id,
        status: 'pending_approval',
        autoApproved: false,
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
