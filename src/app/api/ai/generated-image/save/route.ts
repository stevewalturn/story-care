import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl, uploadFile } from '@/libs/GCS';
import { mediaLibrary, sessions } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generated-image/save - Save individual generated image to media library
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      imageUrl, // The generated image URL (presigned or base64)
      prompt,
      model,
      title,
      description,
      sourceQuote,
      style,
      sessionId,
      patientId,
    } = body;

    console.log('[API /api/ai/generated-image/save] Request received:', {
      userId: user.dbUserId,
      model,
      promptLength: prompt?.length,
      title,
      sessionId,
      patientId,
      hasImageUrl: !!imageUrl,
    });

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      );
    }

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
      if (!imageResponse.ok) {
        throw new Error('Failed to download image from URL');
      }
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

    console.log('[API /api/ai/generated-image/save] Uploaded to GCS:', gcsPath);

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

    // 3. Build generation metadata (separate from therapist notes)
    const generationMetadata = {
      sourceQuote: sourceQuote || null,
      style: style || null,
      savedAt: new Date().toISOString(),
    };

    // 4. Save to database (save GCS path, not presigned URL)
    const result = await db
      .insert(mediaLibrary)
      .values({
        patientId: finalPatientId || null,
        createdByTherapistId: user.dbUserId,
        title: title || 'AI Generated Image',
        description: description || null,
        mediaType: 'image',
        mediaUrl: gcsPath, // Save GCS path, not presigned URL
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: prompt,
        aiModel: model,
        status: 'completed',
        notes: null, // Keep clean for therapist use
        generationMetadata, // AI generation parameters
        tags: ['ai-generated', model ? model.split('-')[0] : 'saved'],
      })
      .returning();

    const media = (result as any[])[0];

    // Generate presigned URL for frontend preview (1-hour expiration)
    const presignedUrl = media?.mediaUrl
      ? await generatePresignedUrl(media.mediaUrl, 1)
      : null;

    console.log('[API /api/ai/generated-image/save] Saved to database:', {
      mediaId: media.id,
      hasPresignedUrl: !!presignedUrl,
    });

    return NextResponse.json({
      success: true,
      media: {
        ...media,
        mediaUrl: presignedUrl || media.mediaUrl,
      },
    });
  } catch (error) {
    console.error('[API /api/ai/generated-image/save] Error occurred:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return handleAuthError(error);
  }
}
