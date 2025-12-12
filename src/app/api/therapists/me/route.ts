import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { users } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

// GET /api/therapists/me - Get current therapist's profile
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);

    // Fetch current user's profile
    const [therapist] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.dbUserId))
      .limit(1);

    if (!therapist) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate presigned URL for avatar if it exists
    const therapistWithSignedUrl = {
      ...therapist,
      avatarUrl: therapist.avatarUrl
        ? await generatePresignedUrl(therapist.avatarUrl, 1).catch(() => therapist.avatarUrl)
        : therapist.avatarUrl,
    };

    return NextResponse.json({ therapist: therapistWithSignedUrl });
  } catch (error) {
    console.error('Error fetching therapist profile:', error);
    return handleAuthError(error);
  }
}

// PATCH /api/therapists/me - Update current therapist's profile
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const { name, email, avatarUrl } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    const changedFields: string[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 255) {
        return NextResponse.json(
          { error: 'Name must be between 2 and 255 characters' },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
      changedFields.push('name');
    }

    if (email !== undefined) {
      if (email) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 },
          );
        }

        // Check if email is already taken by another user
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser && existingUser.id !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Email is already in use' },
            { status: 400 },
          );
        }

        updateData.email = email;
        changedFields.push('email');
      }
    }

    if (avatarUrl !== undefined) {
      // avatarUrl should be a GCS path (e.g., "therapists/avatars/123.jpg")
      // NOT a presigned URL (those expire)
      updateData.avatarUrl = avatarUrl;
      changedFields.push('avatarUrl');
    }

    // If nothing to update
    if (changedFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    updateData.updatedAt = new Date();

    // Update user profile
    const [updatedTherapist] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.dbUserId))
      .returning();

    if (!updatedTherapist) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log profile update
    await logPHIUpdate(user.dbUserId, 'user', user.dbUserId, request, {
      changedFields,
    });

    // Generate presigned URL for avatar if it exists
    const therapistWithSignedUrl = {
      ...updatedTherapist,
      avatarUrl: updatedTherapist.avatarUrl
        ? await generatePresignedUrl(updatedTherapist.avatarUrl, 1).catch(() => updatedTherapist.avatarUrl)
        : updatedTherapist.avatarUrl,
    };

    return NextResponse.json({ therapist: therapistWithSignedUrl });
  } catch (error) {
    console.error('Error updating therapist profile:', error);
    return handleAuthError(error);
  }
}
