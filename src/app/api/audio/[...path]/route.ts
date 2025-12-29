import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * Audio Proxy API
 * Proxies audio requests to GCS to avoid CORS issues
 * Supports range requests for seeking
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ path: string[] }> },
) {
  try {
    // Verify authentication
    await requireAuth(request);

    // Get the audio URL from query params
    const audioUrl = request.nextUrl.searchParams.get('url');
    if (!audioUrl) {
      return NextResponse.json({ error: 'Missing audio URL' }, { status: 400 });
    }

    // Validate URL is from our GCS bucket
    if (!audioUrl.includes('storage.googleapis.com/storycare')) {
      return NextResponse.json({ error: 'Invalid audio URL' }, { status: 400 });
    }

    // Get range header for seeking support
    const rangeHeader = request.headers.get('range');

    // Fetch the audio from GCS
    const fetchHeaders: HeadersInit = {};
    if (rangeHeader) {
      fetchHeaders.Range = rangeHeader;
    }

    const response = await fetch(audioUrl, {
      headers: fetchHeaders,
    });

    if (!response.ok && response.status !== 206) {
      console.error('GCS fetch error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: response.status },
      );
    }

    // Get content type and length
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    // Build response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges || 'bytes',
      'Cache-Control': 'private, max-age=3600',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    // Stream the audio back
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return handleAuthError(error);
  }
}
