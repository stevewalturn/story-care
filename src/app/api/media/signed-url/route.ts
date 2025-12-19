/**
 * Media Signed URL API
 * Generate presigned URLs for GCS media files
 *
 * This endpoint converts GCS paths to temporary presigned URLs that allow
 * secure access to media files stored in Google Cloud Storage.
 *
 * Security:
 * - Requires authentication (therapist/admin/patient)
 * - Validates path format to prevent unauthorized access
 * - URLs expire after 1 hour
 */

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/libs/GCS';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/media/signed-url?path=<gcs-path>
 *
 * Query Parameters:
 * - path: GCS path (e.g., "patients/reference-images/abc123.jpg")
 *
 * Returns:
 * - url: Presigned URL valid for 1 hour
 *
 * Access Control:
 * - Any authenticated user can access
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    // Get path from query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 },
      );
    }

    // Validate path format (basic security check)
    // Ensure it doesn't contain path traversal attempts
    if (path.includes('..') || path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 },
      );
    }

    // Generate presigned URL (1 hour expiration)
    const signedUrl = await generatePresignedUrl(path, 1);

    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return handleAuthError(error);
  }
}
