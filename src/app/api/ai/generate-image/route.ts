import type { NextRequest } from 'next/server';
import type { ImageGenModel } from '@/libs/ImageGeneration';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { generateImage } from '@/libs/ImageGeneration';
import { mediaLibrary, sessions } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generate-image - Generate image with multiple AI providers
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      prompt,
      model = 'gemini-2.5-flash-image',
      negativePrompt,
      width,
      height,
      aspectRatio,
      seed,
      quality,
      style,
      sessionId,
      patientId,
      title,
      referenceImage, // Base64 or URL for image-to-image
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 },
      );
    }

    // Generate image using the unified service
    const { imageUrl, model: usedModel } = await generateImage({
      prompt,
      model: model as ImageGenModel,
      negativePrompt,
      width,
      height,
      aspectRatio,
      seed,
      quality,
      style,
      referenceImage,
    });

    // Handle base64 or URL images
    let imageBuffer: Buffer;
    let contentType = 'image/png';

    if (imageUrl.startsWith('data:')) {
      // Base64 encoded image
      const base64Data = imageUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 image data');
      }
      imageBuffer = Buffer.from(base64Data, 'base64');

      // Extract content type from data URL
      const mimeMatch = imageUrl.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        contentType = mimeMatch[1];
      }
    } else {
      // URL - download the image
      const imageResponse = await fetch(imageUrl);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Get content type from response
      const responseContentType = imageResponse.headers.get('content-type');
      if (responseContentType) {
        contentType = responseContentType;
      }
    }

    // Upload to GCS
    const fileExtension = contentType.split('/')[1] || 'png';
    const { path: gcsPath } = await uploadFile(
      imageBuffer,
      `generated-${Date.now()}.${fileExtension}`,
      {
        folder: 'media/images',
        contentType,
        makePublic: false,
      },
    );

    // 2. GET PATIENT ID from session if not provided
    let finalPatientId = patientId;
    let groupId = null;

    if (!finalPatientId && sessionId) {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      finalPatientId = session?.patientId;
      groupId = session?.groupId;
    }

    // For group sessions, patientId can be null - media belongs to the group/session
    if (!finalPatientId && !groupId && !sessionId) {
      return NextResponse.json(
        { error: 'Either patient ID, group ID, or session ID is required' },
        { status: 400 },
      );
    }

    // 3. Save to database (save GCS path, not presigned URL)
    // patientId can be null for group session media
    const result = await db
      .insert(mediaLibrary)
      .values({
        patientId: finalPatientId || null, // Null for group sessions
        createdByTherapistId: user.dbUserId,
        title: title || 'AI Generated Image',
        mediaType: 'image',
        mediaUrl: gcsPath, // Save GCS path, not presigned URL
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: prompt,
        aiModel: usedModel,
        status: 'completed',
      })
      .returning();

    const media = (result as any[])[0];

    return NextResponse.json({
      media,
      prompt,
      model: usedModel,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return handleAuthError(error);
  }
}
