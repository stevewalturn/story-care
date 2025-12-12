import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { extractGcsPath, generatePresignedUrl } from '@/libs/GCS';
import { pageBlocks, patientPageInteractions, reflectionQuestions, reflectionResponses, scenes, storyPages, surveyQuestions, surveyResponses } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/pages/[id] - Get page with blocks
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const patientView = searchParams.get('patientView') === 'true';

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

    // Generate presigned URLs for media in blocks
    const blocksWithSignedUrls = await Promise.all(
      blocks.map(async (block) => {
        const settings = block.settings as any;
        
        // Handle scene blocks - fetch scene data and generate presigned URL for video
        if (block.blockType === 'scene' && block.sceneId) {
          try {
            // Fetch scene data
            const [scene] = await db
              .select()
              .from(scenes)
              .where(eq(scenes.id, block.sceneId))
              .limit(1);

            if (scene) {
              // Generate presigned URL for the assembled video (or fallback to videoUrl)
              const videoUrl = scene.assembledVideoUrl || scene.videoUrl;
              const signedVideoUrl = videoUrl ? await generatePresignedUrl(videoUrl, 1) : null;
              const signedThumbnailUrl = scene.thumbnailUrl ? await generatePresignedUrl(scene.thumbnailUrl, 1) : null;

              return {
                ...block,
                settings: {
                  ...settings,
                  sceneId: block.sceneId,
                  sceneTitle: scene.title || settings?.sceneTitle || 'Scene',
                  mediaUrl: signedVideoUrl || settings?.mediaUrl, // Use video URL for playback
                  thumbnailUrl: signedThumbnailUrl || settings?.mediaUrl, // Keep thumbnail for display
                  videoUrl: signedVideoUrl, // Add explicit videoUrl field
                  durationSeconds: scene.durationSeconds,
                },
              };
            }
          } catch (error) {
            console.error('Error fetching scene data:', error);
          }
        }
        
        // Handle regular media blocks
        if (settings && settings.mediaUrl) {
          // Generate presigned URL from raw GCS path
          try {
            const signedUrl = await generatePresignedUrl(settings.mediaUrl, 1);
            return {
              ...block,
              settings: {
                ...settings,
                mediaUrl: signedUrl || settings.mediaUrl,
              },
            };
          } catch (error) {
            console.error('Error generating presigned URL:', error);
            return block;
          }
        }
        return block;
      }),
    );

    // If patient view, include reflection and survey questions
    if (patientView) {
      // Get block IDs
      const blockIds = blocksWithSignedUrls.map(b => b.id);

      // Fetch questions for all blocks
      const allReflectionQuestions = [];
      const allSurveyQuestions = [];

      for (const blockId of blockIds) {
        const blockReflectionQuestions = await db
          .select()
          .from(reflectionQuestions)
          .where(eq(reflectionQuestions.blockId, blockId));

        const blockSurveyQuestions = await db
          .select()
          .from(surveyQuestions)
          .where(eq(surveyQuestions.blockId, blockId));

        allReflectionQuestions.push(...blockReflectionQuestions);
        allSurveyQuestions.push(...blockSurveyQuestions);
      }

      return NextResponse.json({
        page,
        blocks: blocksWithSignedUrls,
        reflectionQuestions: allReflectionQuestions,
        surveyQuestions: allSurveyQuestions,
      });
    }

    return NextResponse.json({ page, blocks: blocksWithSignedUrls });
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
      // Delete existing blocks (cascade deletes reflection questions)
      await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));

      // Create new blocks
      for (const [index, block] of blocks.entries()) {
        // Extract GCS path from mediaUrl if present (convert presigned URL to raw path)
        const blockSettings = block.settings || block.content || null;
        if (blockSettings && blockSettings.mediaUrl) {
          const gcsPath = extractGcsPath(blockSettings.mediaUrl);
          if (gcsPath) {
            blockSettings.mediaUrl = gcsPath;
          }
        }

        const [createdBlock] = await db.insert(pageBlocks).values({
          pageId: id,
          blockType: block.type,
          sequenceNumber: index,
          mediaId: block.mediaId || block.content?.mediaId || null,
          sceneId: block.sceneId || block.content?.sceneId || null,
          textContent: block.textContent || block.content?.text || null,
          settings: blockSettings,
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

    // Get block IDs for this page to delete associated responses
    const blocks = await db
      .select({ id: pageBlocks.id })
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, id));

    const blockIds = blocks.map(b => b.id);

    // Delete in correct order to avoid foreign key constraint violations:
    // 1. Delete reflection responses (references reflection_questions)
    if (blockIds.length > 0) {
      for (const blockId of blockIds) {
        const questions = await db
          .select({ id: reflectionQuestions.id })
          .from(reflectionQuestions)
          .where(eq(reflectionQuestions.blockId, blockId));

        for (const question of questions) {
          await db.delete(reflectionResponses).where(eq(reflectionResponses.questionId, question.id));
        }
      }

      // 2. Delete survey responses (references survey_questions)
      for (const blockId of blockIds) {
        const questions = await db
          .select({ id: surveyQuestions.id })
          .from(surveyQuestions)
          .where(eq(surveyQuestions.blockId, blockId));

        for (const question of questions) {
          await db.delete(surveyResponses).where(eq(surveyResponses.questionId, question.id));
        }
      }
    }

    // 3. Delete patient page interactions (references story_pages)
    await db.delete(patientPageInteractions).where(eq(patientPageInteractions.pageId, id));

    // 4. Delete blocks (cascades to reflection_questions and survey_questions)
    await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));

    // 5. Delete page
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
