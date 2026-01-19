import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { recordingLinks } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/recording-links/[id] - Get link details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;

    // Fetch link
    const [link] = await db
      .select()
      .from(recordingLinks)
      .where(eq(recordingLinks.id, id))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: 'Recording link not found' }, { status: 404 });
    }

    // Verify ownership
    if (link.therapistId !== user.dbUserId && user.role !== 'super_admin' && user.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if expired
    const now = new Date();
    let currentStatus = link.status;
    if (link.status !== 'completed' && link.status !== 'revoked' && link.expiresAt < now) {
      currentStatus = 'expired';
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/record/${link.token}`;

    return NextResponse.json({
      link: {
        ...link,
        status: currentStatus,
        shareUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching recording link:', error);
    return handleAuthError(error);
  }
}

// DELETE /api/recording-links/[id] - Revoke a recording link
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;

    // Fetch link
    const [link] = await db
      .select()
      .from(recordingLinks)
      .where(eq(recordingLinks.id, id))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: 'Recording link not found' }, { status: 404 });
    }

    // Verify ownership
    if (link.therapistId !== user.dbUserId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow revoking completed links
    if (link.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot revoke a completed recording link' },
        { status: 400 },
      );
    }

    // Revoke the link
    await db
      .update(recordingLinks)
      .set({
        status: 'revoked',
        updatedAt: new Date(),
      })
      .where(eq(recordingLinks.id, id));

    await logPHIUpdate(user.dbUserId, 'recording_link', id, request, { action: 'revoke' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking recording link:', error);
    return handleAuthError(error);
  }
}
