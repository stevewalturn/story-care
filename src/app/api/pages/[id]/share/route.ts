/**
 * Share Story Page API
 * Generate and manage time-limited shareable links for story pages
 * Supports multiple concurrent share links per page
 */

import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { pageShareLinks, storyPages, users } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/pages/[id]/share
 * Generate a time-limited shareable link
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // Get current user (therapist)
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const { id: pageId } = await context.params;
    const body = await request.json();
    const { expiryMinutes = 60 } = body; // Default 60 minutes

    // Validate expiry minutes
    if (typeof expiryMinutes !== 'number' || expiryMinutes < 1 || expiryMinutes > 10080) {
      // Max 7 days (10080 minutes)
      return NextResponse.json(
        { error: 'Invalid expiry duration. Must be between 1 and 10080 minutes' },
        { status: 400 },
      );
    }

    // Verify page exists and belongs to therapist
    const [page] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.id, pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.createdByTherapistId !== therapist.id) {
      return NextResponse.json(
        { error: 'You do not have permission to share this page' },
        { status: 403 },
      );
    }

    // Generate unique token
    const shareToken = randomBytes(32).toString('hex');

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Create share link
    const [shareLink] = await db
      .insert(pageShareLinks)
      .values({
        pageId,
        token: shareToken,
        expiresAt,
        expiryDurationMinutes: expiryMinutes,
        createdByTherapistId: therapist.id,
        isActive: true,
        accessCount: 0,
      })
      .returning();

    // Generate full share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json(
      {
        message: 'Share link generated successfully',
        shareLink: {
          ...shareLink,
          shareUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/pages/[id]/share
 * Get all share links for a page
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // Get current user (therapist)
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const { id: pageId } = await context.params;

    // Verify page exists and belongs to therapist
    const [page] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.id, pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.createdByTherapistId !== therapist.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view share links for this page' },
        { status: 403 },
      );
    }

    // Get all active share links
    const shareLinks = await db
      .select()
      .from(pageShareLinks)
      .where(
        and(
          eq(pageShareLinks.pageId, pageId),
          eq(pageShareLinks.isActive, true),
        ),
      )
      .orderBy(pageShareLinks.createdAt);

    // Generate share URLs and check expiration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const now = new Date();
    const shareLinksWithUrls = shareLinks.map(link => ({
      ...link,
      shareUrl: `${baseUrl}/share/${link.token}`,
      isExpired: new Date(link.expiresAt) < now,
    }));

    return NextResponse.json({ shareLinks: shareLinksWithUrls });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/pages/[id]/share
 * Revoke all share links for a page
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // Get current user (therapist)
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const { id: pageId } = await context.params;

    // Verify page exists and belongs to therapist
    const [page] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.id, pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.createdByTherapistId !== therapist.id) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke share links for this page' },
        { status: 403 },
      );
    }

    // Revoke all active share links
    await db
      .update(pageShareLinks)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(
        and(
          eq(pageShareLinks.pageId, pageId),
          eq(pageShareLinks.isActive, true),
        ),
      );

    return NextResponse.json({
      message: 'All share links revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking share links:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share links' },
      { status: 500 },
    );
  }
}
