/**
 * Check Invitation API
 * Verifies if an email has a pending invitation and handles different account states
 */

import type { NextRequest } from 'next/server';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

/**
 * GET /api/auth/check-invitation?email=xxx
 *
 * Checks invitation status for an email and returns appropriate response
 *
 * Returns:
 * - 200: Invitation found (status: 'pending')
 * - 200: Account already activated (status: 'already_activated')
 * - 404: No invitation found (status: 'not_found')
 * - 400: Missing email parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    // First, check for pending invitation (invited status, no Firebase UID)
    const invitedUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, normalizedEmail),
        eq(users.status, 'invited'),
        isNull(users.firebaseUid),
      ),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      },
    });

    if (invitedUser) {
      // Valid pending invitation found
      // Fetch organization name if organizationId exists
      let organizationName = 'your organization';
      if (invitedUser.organizationId) {
        const { organizationsSchema } = await import('@/models/Schema');
        const org = await db.query.organizations.findFirst({
          where: eq(organizationsSchema.id, invitedUser.organizationId),
          columns: {
            name: true,
          },
        });
        if (org) {
          organizationName = org.name;
        }
      }

      // Return invitation details
      return NextResponse.json({
        status: 'pending',
        exists: true,
        name: invitedUser.name,
        email: invitedUser.email,
        role: invitedUser.role,
        organizationName,
      });
    }

    // Check if account already exists and is activated
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, normalizedEmail),
        isNotNull(users.firebaseUid),
      ),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (existingUser) {
      // Account already activated
      return NextResponse.json({
        status: 'already_activated',
        message: 'This account has already been activated. Please sign in instead.',
        email: existingUser.email,
      });
    }

    // No invitation found at all
    return NextResponse.json(
      {
        status: 'not_found',
        error: 'No invitation found for this email. Please contact your therapist or administrator.',
      },
      { status: 404 },
    );
  } catch (error) {
    console.error('Failed to check invitation:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation' },
      { status: 500 },
    );
  }
}
