/**
 * API Route: Assessment Instruments (Therapist-facing)
 * GET: List active instruments for "New Assessment" modal
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { listInstruments } from '@/services/AssessmentService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['therapist', 'org_admin', 'super_admin']);

    const instruments = await listInstruments({ status: 'active' });

    return NextResponse.json({ instruments });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching instruments:', error);
    return NextResponse.json({ error: 'Failed to fetch instruments' }, { status: 500 });
  }
}
