import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { aiChatMessages } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// DELETE /api/ai/clear-chat - Clear all chat messages for a session
export async function DELETE(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. VALIDATE INPUT
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    // 3. AUTHORIZATION: Verify user has access to this session
    await requireSessionAccess(request, sessionId);

    // 4. DELETE ALL CHAT MESSAGES FOR THIS SESSION
    await db
      .delete(aiChatMessages)
      .where(
        and(
          eq(aiChatMessages.sessionId, sessionId),
          eq(aiChatMessages.therapistId, user.dbUserId),
        ),
      );

    return NextResponse.json({
      success: true,
      message: 'All chat messages cleared',
    });
  } catch (error) {
    console.error('Clear chat error:', error);
    return handleAuthError(error);
  }
}
