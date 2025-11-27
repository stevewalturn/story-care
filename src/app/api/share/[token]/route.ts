/**
 * Public Share Access API
 * Access story pages via shareable tokens (no authentication required)
 */

import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { pageBlocks, pageShareLinks, reflectionQuestions, storyPages, surveyQuestions, users } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * GET /api/share/[token]
 * Access a shared story page
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Find the share link
    const [shareLink] = await db
      .select()
      .from(pageShareLinks)
      .where(
        and(
          eq(pageShareLinks.token, token),
          eq(pageShareLinks.isActive, true),
        ),
      )
      .limit(1);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Invalid or inactive share link' },
        { status: 404 },
      );
    }

    // Check if link has expired
    const now = new Date();
    if (new Date(shareLink.expiresAt) < now) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 }, // 410 Gone
      );
    }

    // Increment access count
    await db
      .update(pageShareLinks)
      .set({
        accessCount: shareLink.accessCount + 1,
        lastAccessedAt: now,
      })
      .where(eq(pageShareLinks.id, shareLink.id));

    // Fetch the page
    const [page] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.id, shareLink.pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 },
      );
    }

    // Fetch page blocks
    const blocks = await db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, page.id))
      .orderBy(pageBlocks.sequenceNumber);

    // Get reflection block IDs
    const reflectionBlockIds = blocks
      .filter((b: any) => b.blockType === 'reflection')
      .map((b: any) => b.id);

    // Get survey block IDs
    const surveyBlockIds = blocks
      .filter((b: any) => b.blockType === 'survey')
      .map((b: any) => b.id);

    // Fetch reflection questions if any reflection blocks exist
    let reflectionQuestionsData: any[] = [];
    if (reflectionBlockIds.length > 0) {
      reflectionQuestionsData = await db
        .select()
        .from(reflectionQuestions)
        .where(
          eq(
            reflectionQuestions.blockId,
            reflectionBlockIds[0]!, // Use first ID, then filter client-side
          ),
        );

      // Fetch all if multiple blocks
      for (let i = 1; i < reflectionBlockIds.length; i++) {
        const moreQuestions = await db
          .select()
          .from(reflectionQuestions)
          .where(eq(reflectionQuestions.blockId, reflectionBlockIds[i]!));
        reflectionQuestionsData.push(...moreQuestions);
      }
    }

    // Fetch survey questions if any survey blocks exist
    let surveyQuestionsData: any[] = [];
    if (surveyBlockIds.length > 0) {
      surveyQuestionsData = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.blockId, surveyBlockIds[0]!));

      for (let i = 1; i < surveyBlockIds.length; i++) {
        const moreQuestions = await db
          .select()
          .from(surveyQuestions)
          .where(eq(surveyQuestions.blockId, surveyBlockIds[i]!));
        surveyQuestionsData.push(...moreQuestions);
      }
    }

    // Fetch patient name
    const [patient] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, page.patientId))
      .limit(1);

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        description: page.description,
        status: page.status,
        patientName: patient?.name || 'Patient',
      },
      blocks,
      reflectionQuestions: reflectionQuestionsData,
      surveyQuestions: surveyQuestionsData,
      shareLink: {
        expiresAt: shareLink.expiresAt,
        expiryDurationMinutes: shareLink.expiryDurationMinutes,
      },
    });
  } catch (error) {
    console.error('Error accessing shared page:', error);
    return NextResponse.json(
      { error: 'Failed to access shared page' },
      { status: 500 },
    );
  }
}
