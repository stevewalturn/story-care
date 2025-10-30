import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { generateImage, generateImagePrompt } from '@/libs/OpenAI';
import { mediaLibrary, sessions } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generate-image - Generate image with DALL-E
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const { prompt, text, theme, sessionId, patientId, title } = body;

    let finalPrompt = prompt;

    // If text is provided, generate prompt from it
    if (!prompt && text) {
      finalPrompt = await generateImagePrompt(text, theme);
    }

    if (!finalPrompt) {
      return NextResponse.json(
        { error: 'Either prompt or text is required' },
        { status: 400 },
      );
    }

    // Generate image
    const imageUrl = await generateImage(finalPrompt, {
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    });

    // Download and upload to GCS
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const { url: gcsUrl, path } = await uploadFile(
      imageBuffer,
      `generated-${Date.now()}.png`,
      {
        folder: 'media/images',
        contentType: 'image/png',
        makePublic: false,
      },
    );

    // 2. GET PATIENT ID from session if not provided
    let finalPatientId = patientId;
    if (!finalPatientId && sessionId) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      finalPatientId = session?.patientId;
    }

    if (!finalPatientId) {
      return NextResponse.json(
        { error: 'Patient ID is required (either directly or via session)' },
        { status: 400 },
      );
    }

    // 3. Save to database
    const [media] = await db
      .insert(mediaLibrary)
      .values({
        patientId: finalPatientId,
        createdByTherapistId: user.dbUserId,
        title: title || 'AI Generated Image',
        mediaType: 'image',
        mediaUrl: gcsUrl,
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: finalPrompt,
        aiModel: 'dall-e-3',
        status: 'completed',
      })
      .returning();

    return NextResponse.json({
      media,
      prompt: finalPrompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return handleAuthError(error);
  }
}
