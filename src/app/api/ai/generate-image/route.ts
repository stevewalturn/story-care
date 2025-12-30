import type { NextRequest } from 'next/server';
import type { ImageGenModel } from '@/libs/ImageGeneration';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl, uploadFile } from '@/libs/GCS';
import { generateImage } from '@/libs/ImageGeneration';
import { parseAtlasError } from '@/libs/providers/AtlasCloud';
import { mediaLibrary, sessions } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

/**
 * Parse image generation errors into user-friendly messages
 */
function parseImageGenError(error: unknown): { message: string; code: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Atlas Cloud errors
  if (errorMessage.includes('Atlas Cloud') || errorMessage.includes('atlascloud')) {
    return {
      message: parseAtlasError(errorMessage),
      code: 'ATLAS_ERROR',
    };
  }

  // Model-specific validation errors (from AtlasCloud.ts)
  if (errorMessage.includes('requires a reference image')) {
    return {
      message: errorMessage,
      code: 'MISSING_REFERENCE_IMAGE',
    };
  }

  if (errorMessage.includes('Unknown model')) {
    return {
      message: errorMessage,
      code: 'INVALID_MODEL',
    };
  }

  // API key errors
  if (errorMessage.includes('API_KEY') || errorMessage.includes('not configured')) {
    return {
      message: 'Image generation service is not configured. Please contact support.',
      code: 'SERVICE_NOT_CONFIGURED',
    };
  }

  // OpenAI/Gemini errors
  if (errorMessage.includes('content_policy') || errorMessage.includes('safety')) {
    return {
      message: 'The prompt was rejected due to content policy. Please modify your prompt and try again.',
      code: 'CONTENT_POLICY',
    };
  }

  // Rate limiting
  if (errorMessage.includes('rate') || errorMessage.includes('429')) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
    };
  }

  // Timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      message: 'Image generation timed out. Please try again with a simpler prompt.',
      code: 'TIMEOUT',
    };
  }

  // Generic fallback
  return {
    message: errorMessage || 'Failed to generate image. Please try again.',
    code: 'GENERATION_FAILED',
  };
}

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
      referenceImage, // Single image (backward compatibility)
      referenceImages: rawReferenceImages, // Array of images (new)
      skipSave = false, // For batch generation - return URL without saving
    } = body;

    // Support both single referenceImage and referenceImages array
    // Merge them into a single array
    const referenceImages: string[] = [];
    if (rawReferenceImages && Array.isArray(rawReferenceImages)) {
      referenceImages.push(...rawReferenceImages);
    }
    if (referenceImage && !referenceImages.includes(referenceImage)) {
      referenceImages.push(referenceImage);
    }

    console.log('[API /api/ai/generate-image] Request received:', {
      userId: user.dbUserId,
      model,
      promptLength: prompt?.length,
      width,
      height,
      aspectRatio,
      seed,
      quality,
      style,
      sessionId,
      patientId: patientId || 'from patientIds array',
      title,
      referenceImageCount: referenceImages.length,
      patientIds: body.patientIds,
      size: body.size,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 },
      );
    }

    console.log('[API /api/ai/generate-image] Calling generateImage with model:', model);

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
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
    });

    console.log('[API /api/ai/generate-image] Image generated successfully:', {
      usedModel,
      imageUrlType: imageUrl.startsWith('data:') ? 'base64' : 'url',
      imageUrlLength: imageUrl.length,
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

    // If skipSave is true (batch generation), return URL without saving to database
    if (skipSave) {
      const presignedUrl = await generatePresignedUrl(gcsPath, 1);

      console.log('[API /api/ai/generate-image] Returning without saving (skipSave=true):', {
        hasPresignedUrl: !!presignedUrl,
      });

      return NextResponse.json({
        imageUrl: presignedUrl || gcsPath,
        prompt,
        model: usedModel,
      });
    }

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

    // Generate presigned URL for frontend preview (1-hour expiration)
    const presignedUrl = media?.mediaUrl
      ? await generatePresignedUrl(media.mediaUrl, 1)
      : null;

    console.log('[API /api/ai/generate-image] Presigned URL generation:', {
      originalPath: media?.mediaUrl,
      presignedUrlPreview: presignedUrl ? `${presignedUrl.substring(0, 100)}...` : null,
      hasPresignedUrl: !!presignedUrl,
      isAlreadySigned: presignedUrl ? (presignedUrl.includes('X-Goog-Signature') || presignedUrl.includes('GoogleAccessId')) : false,
    });

    return NextResponse.json({
      media: {
        ...media,
        mediaUrl: presignedUrl || media.mediaUrl,
      },
      prompt,
      model: usedModel,
    });
  } catch (error) {
    // Parse and log error details
    const parsedError = parseImageGenError(error);

    console.error('[API /api/ai/generate-image] Error occurred:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : typeof error,
      parsedError,
    });

    // Check if it's an auth error first
    if (error instanceof Error && (
      error.message.includes('Unauthorized')
      || error.message.includes('Authentication')
      || error.message.includes('token')
    )) {
      return handleAuthError(error);
    }

    // Return user-friendly error message with error code
    return NextResponse.json(
      {
        error: parsedError.message,
        code: parsedError.code,
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 },
    );
  }
}
