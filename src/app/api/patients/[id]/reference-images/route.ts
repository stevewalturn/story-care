import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePresignedUrl, uploadFile } from '@/libs/GCS';
import {
  addReferenceImage,
  getPatientReferenceImages,
} from '@/services/PatientReferenceImageService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { checkRateLimit, getClientIP, uploadRateLimit } from '@/utils/RateLimiter';

// GET /api/patients/[id]/reference-images - Get all reference images for a patient
// HIPAA COMPLIANCE: Requires authentication and audit logging
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. AUTHENTICATION: Verify user is a therapist or admin
    await requireTherapist(request);

    // 2. GET PATIENT ID
    const { id: patientId } = await params;

    // 3. FETCH REFERENCE IMAGES
    const images = await getPatientReferenceImages(patientId);

    // 4. GENERATE PRESIGNED URLS (1-hour expiration for security)
    const imagesWithSignedUrls = await Promise.all(
      images.map(async (img) => ({
        ...img,
        imageUrl: await generatePresignedUrl(img.imageUrl, 1),
      })),
    );

    return NextResponse.json({ images: imagesWithSignedUrls });
  } catch (error) {
    console.error('Error fetching reference images:', error);
    return handleAuthError(error);
  }
}

// POST /api/patients/[id]/reference-images - Add a new reference image for a patient
// HIPAA COMPLIANCE: Requires authentication, rate limiting, and audit logging
// CRITICAL: This endpoint handles PHI (patient reference images)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. RATE LIMITING: Prevent upload abuse (20 uploads per hour for images)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`upload-ref-image:${clientIP}`, uploadRateLimit);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many upload attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // 2. AUTHENTICATION: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 3. GET PATIENT ID
    const { id: patientId } = await params;

    // 4. PARSE REQUEST BODY
    // Check if multipart/form-data (file upload) or JSON (existing imageUrl)
    const contentType = request.headers.get('content-type') || '';

    let imageUrl: string;
    let label: string | undefined;
    let isPrimary: boolean = false;

    if (contentType.includes('multipart/form-data')) {
      // FILE UPLOAD FLOW
      // 4a. VALIDATE FILE SIZE
      const contentLength = request.headers.get('content-length');
      const maxSize = 10 * 1024 * 1024; // 10MB for images

      if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 413 },
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      label = formData.get('label') as string | undefined;
      isPrimary = formData.get('isPrimary') === 'true';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type - images only
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

      if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only image files are allowed (JPEG, PNG, WebP, GIF).' },
          { status: 400 },
        );
      }

      // Validate file size again
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 413 },
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = require('node:buffer').Buffer.from(arrayBuffer);

      // 4b. UPLOAD TO GCS (PHI storage)
      const { path } = await uploadFile(buffer, file.name, {
        folder: 'patients/reference-images',
        contentType: file.type || 'image/jpeg',
        makePublic: false, // HIPAA: Never make PHI files public
      });

      imageUrl = path;
    } else {
      // JSON PAYLOAD FLOW (for already uploaded images)
      const body = await request.json();
      const schema = z.object({
        imageUrl: z.string().min(1, 'Image URL is required'),
        label: z.string().optional(),
        isPrimary: z.boolean().optional(),
      });

      const validated = schema.parse(body);
      imageUrl = validated.imageUrl;
      label = validated.label;
      isPrimary = validated.isPrimary || false;
    }

    // 5. ADD REFERENCE IMAGE TO DATABASE
    const newImage = await addReferenceImage({
      patientId,
      imageUrl,
      label,
      uploadedBy: user.dbUserId,
      isPrimary,
    });

    // 6. GENERATE PRESIGNED URL for immediate display (1-hour expiration)
    const imageWithSignedUrl = {
      ...newImage,
      imageUrl: await generatePresignedUrl(newImage.imageUrl, 1),
    };

    return NextResponse.json({ image: imageWithSignedUrl }, { status: 201 });
  } catch (error) {
    console.error('Error adding reference image:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
