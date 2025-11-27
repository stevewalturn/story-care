/**
 * Submit Responses via Share Link
 * POST: Submit reflection and survey responses from public share link
 */

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  pageShareLinks,
  reflectionResponses,
  storyPages,
  surveyResponses,
} from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Validate the share link
    const [shareLink] = await db
      .select({
        id: pageShareLinks.id,
        pageId: pageShareLinks.pageId,
        expiresAt: pageShareLinks.expiresAt,
        isActive: pageShareLinks.isActive,
        revokedAt: pageShareLinks.revokedAt,
      })
      .from(pageShareLinks)
      .where(eq(pageShareLinks.token, token))
      .limit(1);

    if (!shareLink) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 });
    }

    if (!shareLink.isActive || shareLink.revokedAt) {
      return NextResponse.json({ error: 'Share link has been revoked' }, { status: 410 });
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Get the story page to find the patient ID
    const [page] = await db
      .select({
        id: storyPages.id,
        patientId: storyPages.patientId,
      })
      .from(storyPages)
      .where(eq(storyPages.id, shareLink.pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Story page not found' }, { status: 404 });
    }

    const body = await request.json();
    const { reflectionResponses: reflectionData, surveyResponses: surveyData } = body;

    // Insert reflection responses
    if (reflectionData && Array.isArray(reflectionData)) {
      for (const response of reflectionData) {
        if (!response.responseText || !response.questionId) {
          continue;
        }

        await db.insert(reflectionResponses).values({
          questionId: response.questionId,
          patientId: page.patientId,
          pageId: page.id,
          responseText: response.responseText,
        });
      }
    }

    // Insert survey responses
    if (surveyData && Array.isArray(surveyData)) {
      for (const response of surveyData) {
        if (response.response === undefined || !response.questionId) {
          continue;
        }

        const isNumeric = typeof response.response === 'number';
        await db.insert(surveyResponses).values({
          questionId: response.questionId,
          patientId: page.patientId,
          pageId: page.id,
          responseValue: isNumeric ? null : String(response.response),
          responseNumeric: isNumeric ? response.response : null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Responses submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting responses:', error);
    return NextResponse.json(
      { error: 'Failed to submit responses' },
      { status: 500 },
    );
  }
}
