import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { pageBlocks, storyPages } from '@/models/Schema';

// GET /api/pages - List story pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const therapistId = searchParams.get('therapistId');

    let query = db.select().from(storyPages);

    if (patientId) {
      query = query.where(eq(storyPages.patientId, patientId)) as any;
    } else if (therapistId) {
      query = query.where(eq(storyPages.createdByTherapistId, therapistId)) as any;
    }

    const pages = await query.orderBy(desc(storyPages.updatedAt));

    // Get block counts for each page
    const pagesWithCounts = await Promise.all(
      pages.map(async (page) => {
        const blocks = await db
          .select()
          .from(pageBlocks)
          .where(eq(pageBlocks.pageId, page.id));

        return {
          ...page,
          blockCount: blocks.length,
        };
      }),
    );

    return NextResponse.json({ pages: pagesWithCounts });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 },
    );
  }
}

// POST /api/pages - Create story page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { therapistId, patientId, title, blocks } = body;

    if (!therapistId || !patientId || !title) {
      return NextResponse.json(
        { error: 'therapistId, patientId, and title are required' },
        { status: 400 },
      );
    }

    // Create page
    const [page] = await db
      .insert(storyPages)
      .values({
        createdByTherapistId: therapistId,
        patientId,
        title,
        status: 'draft',
      })
      .returning();

    if (!page) {
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 },
      );
    }

    // Create blocks if provided
    if (blocks && Array.isArray(blocks)) {
      await Promise.all(
        blocks.map((block: any, index: number) =>
          db.insert(pageBlocks).values({
            pageId: page.id,
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

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 },
    );
  }
}
