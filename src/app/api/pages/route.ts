import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { pageBlocks, storyPages, users } from '@/models/Schema';

// GET /api/pages - List story pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const therapistFirebaseUid = searchParams.get('therapistId');
    const patientView = searchParams.get('patientView');

    let query = db.select().from(storyPages);

    // Patient view: show only published pages assigned to current patient
    if (patientView === 'true') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const decodedToken = await verifyIdToken(token);

      // Find current patient user by Firebase UID
      const [currentUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, decodedToken.uid))
        .limit(1);

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Filter: pages assigned to this patient AND published
      query = query.where(
        and(
          eq(storyPages.patientId, currentUser.id),
          eq(storyPages.status, 'published'),
        ),
      ) as any;
    } else if (patientId) {
      query = query.where(eq(storyPages.patientId, patientId)) as any;
    } else if (therapistFirebaseUid) {
      // Convert Firebase UID to database UUID
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      if (therapist) {
        query = query.where(eq(storyPages.createdByTherapistId, therapist.id)) as any;
      } else {
        // If therapist not found, return empty array
        return NextResponse.json({ pages: [] });
      }
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
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // Get current user (therapist)
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { patientId, title, blocks } = body;

    if (!patientId || !title) {
      return NextResponse.json(
        { error: 'patientId and title are required' },
        { status: 400 },
      );
    }

    // Create page
    const [page] = await db
      .insert(storyPages)
      .values({
        createdByTherapistId: therapist.id,
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
