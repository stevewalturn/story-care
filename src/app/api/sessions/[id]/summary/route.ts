/**
 * Session Summary API
 * Get or generate session summary for AI context
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { getOrCreateSessionSummary } from '@/services/SessionSummaryService';
import { handleAuthError } from '@/utils/AuthHelpers';

/**
 * GET /api/sessions/[id]/summary
 * Get existing or generate new session summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this session
    await requireSessionAccess(request, id);

    // Get or create summary
    const summary = await getOrCreateSessionSummary(id);

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error('Error fetching session summary:', error);
    return handleAuthError(error);
  }
}
