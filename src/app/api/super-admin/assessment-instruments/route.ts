/**
 * API Route: Super Admin Assessment Instruments
 * GET: List all instruments with optional filtering
 * POST: Create new instrument with items
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createInstrument, listInstruments } from '@/services/AssessmentService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';
import { createInstrumentSchema, listInstrumentsQuerySchema } from '@/validations/AssessmentValidation';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);

    const { searchParams } = new URL(request.url);
    const queryParams = listInstrumentsQuerySchema.safeParse({
      instrumentType: searchParams.get('instrumentType') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryParams.error.issues },
        { status: 400 },
      );
    }

    const instruments = await listInstruments(queryParams.data);

    return NextResponse.json({ instruments, total: instruments.length });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching instruments:', error);
    return NextResponse.json({ error: 'Failed to fetch instruments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['super_admin']);

    const body = await request.json();
    const validation = createInstrumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const instrument = await createInstrument({
      ...validation.data,
      createdBy: user.dbUserId,
    });

    if (!instrument) {
      return NextResponse.json({ error: 'Failed to create instrument' }, { status: 500 });
    }

    const { logPHICreate } = await import('@/libs/AuditLogger');
    await logPHICreate(user.dbUserId, 'assessment_instrument', instrument.id, request);

    return NextResponse.json({ instrument }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error creating instrument:', error);
    return NextResponse.json({ error: 'Failed to create instrument' }, { status: 500 });
  }
}
