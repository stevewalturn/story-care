/**
 * Check Invitation API
 * Verifies if an email has a pending invitation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * GET /api/auth/check-invitation?email=xxx
 *
 * Checks if an email has a pending invitation (invited status, no Firebase UID)
 *
 * Returns:
 * - 200: Invitation found with user details
 * - 404: No invitation found
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

    // Check for invited user with this email
    const invitedUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, email.toLowerCase()),
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

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'No invitation found for this email' },
        { status: 404 },
      );
    }

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
      exists: true,
      name: invitedUser.name,
      email: invitedUser.email,
      role: invitedUser.role,
      organizationName,
    });
  } catch (error) {
    console.error('Failed to check invitation:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation' },
      { status: 500 },
    );
  }
}
