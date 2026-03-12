/**
 * Check Phone Invitation API
 * Returns invitation details for an invited user identified by phone number.
 * Used by /setup-account-phone to get the user's email before password creation.
 * Only returns data for users with status='invited' and no firebaseUid yet.
 */

import type { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { organizationsSchema, users } from '@/models/Schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({
        email: users.email,
        name: users.name,
        role: users.role,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(
        and(
          eq(users.phoneNumber, phone),
          eq(users.status, 'invited'),
          isNull(users.firebaseUid),
        ),
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'No pending invitation found for this phone number.' },
        { status: 404 },
      );
    }

    let organizationName = '';
    if (user.organizationId) {
      const [org] = await db
        .select({ name: organizationsSchema.name })
        .from(organizationsSchema)
        .where(eq(organizationsSchema.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? '';
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      organizationName,
    });
  } catch (error) {
    console.error('check-phone-invitation error:', error);
    return NextResponse.json({ error: 'Failed to check invitation' }, { status: 500 });
  }
}
