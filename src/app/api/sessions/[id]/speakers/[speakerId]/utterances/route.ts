import type { NextRequest } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { utterances } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; speakerId: string }>;
};

// GET /api/sessions/[id]/speakers/[speakerId]/utterances?offset=0&limit=10
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId, speakerId } = await context.params;
    await requireSessionAccess(request, sessionId);

    const { searchParams } = new URL(request.url);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);

    if (offset < 0 || limit <= 0 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const speakerUtterances = await db
      .select({
        id: utterances.id,
        text: utterances.text,
        startTimeSeconds: utterances.startTimeSeconds,
        endTimeSeconds: utterances.endTimeSeconds,
        sequenceNumber: utterances.sequenceNumber,
      })
      .from(utterances)
      .where(eq(utterances.speakerId, speakerId))
      .orderBy(asc(utterances.sequenceNumber))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = speakerUtterances.length > limit;
    const utterancesList = hasMore ? speakerUtterances.slice(0, limit) : speakerUtterances;

    let total: number | undefined;
    if (offset === 0) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(utterances)
        .where(eq(utterances.speakerId, speakerId));
      total = countResult?.count || 0;
    }

    return NextResponse.json({
      utterances: utterancesList,
      total,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error fetching utterances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utterances' },
      { status: 500 },
    );
  }
}
