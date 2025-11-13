import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { quotes } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/quotes/[id] - Get single quote
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
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

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 },
    );
  }
}

// PUT /api/quotes/[id] - Update quote
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: quoteId } = await context.params;
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
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 },
    );
  }
}

// DELETE /api/quotes/[id] - Delete quote
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: quoteId } = await context.params;

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
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 },
    );
  }
}
