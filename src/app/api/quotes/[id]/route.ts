import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { quotes, users } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError, requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/quotes/[id] - Get single quote
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await requireAuth(request);
    const { id: quoteId } = await context.params;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 },
      );
    }

    // Authorization: creator, assigned therapist, or admin can view
    if (user.role === 'therapist' && quote.createdByTherapistId !== user.dbUserId) {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, quote.patientId),
      });
      if (!patient || patient.therapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this quote' },
          { status: 403 },
        );
      }
    }

    if (user.role === 'patient' && quote.patientId !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this quote' },
        { status: 403 },
      );
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return handleAuthError(error);
  }
}

// PUT /api/quotes/[id] - Update quote
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await requireAuth(request);
    const { id: quoteId } = await context.params;

    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 },
      );
    }

    // Therapists must be BOTH the creator AND currently assigned to the patient to edit
    if (user.role === 'therapist') {
      if (existingQuote.createdByTherapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: Only the quote creator can edit this quote' },
          { status: 403 },
        );
      }
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
      if (!therapistPatientIds.includes(existingQuote.patientId)) {
        return NextResponse.json(
          { error: 'Forbidden: Patient is no longer assigned to you' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const {
      quoteText,
      tags,
      notes,
    } = body;

    // Build update object (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (quoteText !== undefined) {
      updateData.quoteText = quoteText;
    }
    if (tags !== undefined) {
      updateData.tags = tags;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const [updatedQuote] = await db
      .update(quotes)
      .set(updateData)
      .where(eq(quotes.id, quoteId))
      .returning();

    if (!updatedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    console.error('Error updating quote:', error);
    return handleAuthError(error);
  }
}

// DELETE /api/quotes/[id] - Delete quote
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await requireAuth(request);
    const { id: quoteId } = await context.params;

    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 },
      );
    }

    // Therapists must be BOTH the creator AND currently assigned to the patient to delete
    if (user.role === 'therapist') {
      if (existingQuote.createdByTherapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: Only the quote creator can delete this quote' },
          { status: 403 },
        );
      }
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
      if (!therapistPatientIds.includes(existingQuote.patientId)) {
        return NextResponse.json(
          { error: 'Forbidden: Patient is no longer assigned to you' },
          { status: 403 },
        );
      }
    }

    const [deletedQuote] = await db
      .delete(quotes)
      .where(eq(quotes.id, quoteId))
      .returning();

    if (!deletedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return handleAuthError(error);
  }
}
