import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { recordingLinks, users } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

// GET /api/record/[token] - Validate token and return link details (public, no auth)
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Fetch link by token
    const [link] = await db
      .select({
        id: recordingLinks.id,
        sessionTitle: recordingLinks.sessionTitle,
        sessionDate: recordingLinks.sessionDate,
        notes: recordingLinks.notes,
        therapistId: recordingLinks.therapistId,
        organizationId: recordingLinks.organizationId,
        status: recordingLinks.status,
        expiresAt: recordingLinks.expiresAt,
        accessCount: recordingLinks.accessCount,
      })
      .from(recordingLinks)
      .where(eq(recordingLinks.token, token))
      .limit(1);

    if (!link) {
      return NextResponse.json(
        { error: 'Recording link not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check status
    if (link.status === 'revoked') {
      return NextResponse.json(
        { error: 'This recording link has been revoked', code: 'REVOKED' },
        { status: 410 },
      );
    }

    if (link.status === 'completed') {
      return NextResponse.json(
        { error: 'This recording link has already been used', code: 'COMPLETED' },
        { status: 410 },
      );
    }

    // Check expiration
    const now = new Date();
    if (link.expiresAt < now) {
      // Update status to expired
      await db
        .update(recordingLinks)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(recordingLinks.id, link.id));

      return NextResponse.json(
        { error: 'This recording link has expired', code: 'EXPIRED' },
        { status: 410 },
      );
    }

    // Fetch therapist info for display
    const [therapist] = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, link.therapistId))
      .limit(1);

    // Update access count
    await db
      .update(recordingLinks)
      .set({
        accessCount: link.accessCount + 1,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(recordingLinks.id, link.id));

    // Calculate time remaining
    const timeRemainingMs = link.expiresAt.getTime() - now.getTime();
    const timeRemainingMinutes = Math.floor(timeRemainingMs / (1000 * 60));

    return NextResponse.json({
      valid: true,
      linkId: link.id,
      sessionTitle: link.sessionTitle,
      sessionDate: link.sessionDate,
      notes: link.notes,
      therapistName: therapist?.name || 'Therapist',
      expiresAt: link.expiresAt,
      timeRemainingMinutes,
    });
  } catch (error) {
    console.error('Error validating recording token:', error);
    return NextResponse.json(
      { error: 'Failed to validate recording link' },
      { status: 500 },
    );
  }
}
