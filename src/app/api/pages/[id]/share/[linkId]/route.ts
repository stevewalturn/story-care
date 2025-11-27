/**
 * Individual Share Link Management API
 * Revoke specific share links
 */

import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { pageShareLinks, storyPages, users } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; linkId: string }>;
};

/**
 * DELETE /api/pages/[id]/share/[linkId]
 * Revoke a specific share link
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

    const { id: pageId, linkId } = await context.params;

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

    // Verify share link exists and belongs to this page
    const [shareLink] = await db
      .select()
      .from(pageShareLinks)
      .where(
        and(
          eq(pageShareLinks.id, linkId),
          eq(pageShareLinks.pageId, pageId),
        ),
      )
      .limit(1);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 },
      );
    }

    // Revoke the share link
    await db
      .update(pageShareLinks)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(eq(pageShareLinks.id, linkId));

    return NextResponse.json({
      message: 'Share link revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 },
    );
  }
}
