/**
 * Media Download Proxy API
 * Proxies media downloads through the server to bypass CORS restrictions
 *
 * This endpoint fetches the file from GCS and streams it back with proper
 * Content-Disposition headers to force a download in the browser.
 *
 * Security:
 * - Requires authentication (therapist/admin/patient)
 * - Validates path format to prevent unauthorized access
 */

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/libs/GCS';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/media/download?path=<gcs-path>&filename=<filename>
 *
 * Query Parameters:
 * - path: GCS path (e.g., "patients/reference-images/abc123.jpg")
 * - filename: Desired download filename (e.g., "my-image.png")
 *
 * Returns:
 * - Binary file with Content-Disposition: attachment header
 *
 * Access Control:
 * - Any authenticated user can access
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const filename = searchParams.get('filename') || 'download';

    if (!path) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 },
      );
    }

    // Validate path format (basic security check)
    if (path.includes('..') || path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 },
      );
    }

    // Generate presigned URL
    const signedUrl = await generatePresignedUrl(path, 1);

    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 },
      );
    }

    // Fetch the file from GCS
    const response = await fetch(signedUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file from storage' },
        { status: 502 },
      );
    }

    // Get the file content
    const blob = await response.blob();

    // Determine content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return with download headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': blob.size.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to download file:', error);
    return handleAuthError(error);
  }
}
