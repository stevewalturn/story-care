import { NextRequest, NextResponse } from 'next/server';
import { generateImage, generateImagePrompt } from '@/libs/OpenAI';
import { uploadFile } from '@/libs/GCS';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';

// POST /api/ai/generate-image - Generate image with DALL-E
export async function POST(request: NextRequest) {
  try {
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

    // Save to database
    const [media] = await db
      .insert(mediaLibrary)
      .values({
        sessionId: sessionId || null,
        patientId: patientId || null,
        mediaType: 'image',
        title: title || 'AI Generated Image',
        url: gcsUrl,
        storagePath: path,
        generatedPrompt: finalPrompt,
      })
      .returning();

    return NextResponse.json({
      media,
      prompt: finalPrompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 },
    );
  }
}
