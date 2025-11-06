import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { pageBlocks, storyPages } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/pages/[id] - Get page with blocks
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [page] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.id, id));

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const blocks = await db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, id))
      .orderBy(pageBlocks.sequenceNumber);

    return NextResponse.json({ page, blocks });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 },
    );
  }
}

// PUT /api/pages/[id] - Update page
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, blocks, status, patientId } = body;

    // Update page
    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) {
      updateData.title = title;
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published') {
        updateData.publishedAt = new Date();
      }
    }
    if (patientId !== undefined) {
      updateData.patientId = patientId;
    }

    const [page] = await db
      .update(storyPages)
      .set(updateData)
      .where(eq(storyPages.id, id))
      .returning();

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Update blocks if provided
    if (blocks && Array.isArray(blocks)) {
      // Delete existing blocks
      await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));

      // Create new blocks
      await Promise.all(
        blocks.map((block: any, index: number) =>
          db.insert(pageBlocks).values({
            pageId: id,
            blockType: block.type,
            sequenceNumber: index,
            mediaId: block.mediaId || null,
            sceneId: block.sceneId || null,
            textContent: block.textContent || null,
            settings: block.settings || null,
          }),
        ),
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 },
    );
  }
}

// DELETE /api/pages/[id] - Delete page
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Delete blocks first
    await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));

    // Delete page
    await db.delete(storyPages).where(eq(storyPages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 },
    );
  }
}
