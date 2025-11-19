import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { pageBlocks, reflectionQuestions, storyPages, surveyQuestions, users } from '@/models/Schema';

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

    // Get block counts and patient names for each page
    const pagesWithDetails = await Promise.all(
      pages.map(async (page) => {
        const blocks = await db
          .select()
          .from(pageBlocks)
          .where(eq(pageBlocks.pageId, page.id));

        // Get patient name
        const [patient] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, page.patientId))
          .limit(1);

        return {
          ...page,
          blockCount: blocks.length,
          patientName: patient?.name || 'Unknown Patient',
          isPublished: page.status === 'published',
        };
      }),
    );

    return NextResponse.json({ pages: pagesWithDetails });
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
      for (const [index, block] of blocks.entries()) {
        const [createdBlock] = await db.insert(pageBlocks).values({
          pageId: page.id,
          blockType: block.type,
          sequenceNumber: index,
          mediaId: block.mediaId || null,
          sceneId: block.sceneId || null,
          textContent: block.textContent || null,
          settings: block.settings || null,
        }).returning();

        // If this is a reflection block with questions, create reflection question rows
        if (block.type === 'reflection' && block.content?.questions && createdBlock) {
          await Promise.all(
            block.content.questions.map((question: any) =>
              db.insert(reflectionQuestions).values({
                blockId: createdBlock.id,
                questionText: question.text,
                questionType: question.type || 'open_text',
                sequenceNumber: question.sequenceNumber,
              }),
            ),
          );
        }

        // If this is a survey block with questions, create survey question rows
        if (block.type === 'survey' && block.content?.surveyQuestions && createdBlock) {
          await Promise.all(
            block.content.surveyQuestions.map((question: any) =>
              db.insert(surveyQuestions).values({
                blockId: createdBlock.id,
                questionText: question.text,
                questionType: question.type || 'open_text',
                sequenceNumber: question.sequenceNumber,
                scaleMin: question.scaleMin,
                scaleMax: question.scaleMax,
                scaleMinLabel: question.scaleMinLabel,
                scaleMaxLabel: question.scaleMaxLabel,
                options: question.options ? JSON.stringify(question.options) : null,
              }),
            ),
          );
        }
      }
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
