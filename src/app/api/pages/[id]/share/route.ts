/**
 * Share Story Page API
 * Generate and manage time-limited shareable links for story pages
 */

import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { storyPagesSchema } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * POST /api/pages/[id]/share
 * Generate a time-limited shareable link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    // Only therapists and admins can create share links
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot create share links' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { expiryDuration } = body as { expiryDuration: '15min' | '1hour' | '2hours' };

    // Validate expiry duration
    if (!['15min', '1hour', '2hours'].includes(expiryDuration)) {
      return NextResponse.json(
        { error: 'Invalid expiry duration. Must be 15min, 1hour, or 2hours' },
        { status: 400 },
      );
    }

    // Verify page exists and user has access
    const [page] = await db
      .select()
      .from(storyPagesSchema)
      .where(eq(storyPagesSchema.id, id))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if user created this page or is admin
    if (page.createdByTherapistId !== user.dbUserId && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this page' },
        { status: 403 },
      );
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex');

    // Calculate expiry timestamp
    const now = new Date();
    let expiresAt: Date;

    switch (expiryDuration) {
      case '15min':
        expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
        break;
      case '1hour':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case '2hours':
        expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        break;
      default:
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
    }

    // Update page with share token
    await db
      .update(storyPagesSchema)
      .set({
        shareToken,
        shareExpiresAt: expiresAt,
        shareExpiryDuration: expiryDuration,
        isShareable: true,
        updatedAt: new Date(),
      })
      .where(eq(storyPagesSchema.id, id));

    // Build shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json(
      {
        message: 'Share link generated successfully',
        shareUrl,
        shareToken,
        expiresAt: expiresAt.toISOString(),
        expiryDuration,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error generating share link:', error);
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/pages/[id]/share
 * Revoke/invalidate a shareable link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    // Only therapists and admins can revoke share links
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot revoke share links' },
        { status: 403 },
      );
    }

    // Verify page exists and user has access
    const [page] = await db
      .select()
      .from(storyPagesSchema)
      .where(eq(storyPagesSchema.id, id))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if user created this page or is admin
    if (page.createdByTherapistId !== user.dbUserId && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this page' },
        { status: 403 },
      );
    }

    // Clear share token and expiry
    await db
      .update(storyPagesSchema)
      .set({
        shareToken: null,
        shareExpiresAt: null,
        shareExpiryDuration: null,
        isShareable: false,
        updatedAt: new Date(),
      })
      .where(eq(storyPagesSchema.id, id));

    return NextResponse.json({
      message: 'Share link revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return handleAuthError(error);
  }
}
