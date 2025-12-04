/**
 * Client-safe GCS utilities
 * These functions can be used in both client and server components
 * as they don't require Node.js-specific modules
 */

/**
 * Extract GCS path from a full URL
 * Supports various GCS URL formats:
 * - https://storage.googleapis.com/bucket-name/path/to/file.jpg
 * - gs://bucket-name/path/to/file.jpg
 * - https://storage.cloud.google.com/bucket-name/path/to/file.jpg
 *
 * @param url - Full GCS URL or already a path
 * @returns GCS path or null if invalid
 */
export function extractGcsPath(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's already a path (no protocol), return as-is
  if (!url.startsWith('http') && !url.startsWith('gs://')) {
    return url;
  }

  // Strip query parameters (like ?GoogleAccessId=...) before extraction
  const urlWithoutQuery = url.split('?')[0];
  if (!urlWithoutQuery) return null;

  // Handle gs:// protocol
  if (urlWithoutQuery.startsWith('gs://')) {
    const match = urlWithoutQuery.match(/^gs:\/\/[^/]+\/(.+)$/);
    return match ? match[1] || null : null;
  }

  // Handle https:// URLs from GCS
  const storageMatch = urlWithoutQuery.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
  if (storageMatch) return storageMatch[1] || null;

  const cloudMatch = urlWithoutQuery.match(/storage\.cloud\.google\.com\/[^/]+\/(.+)/);
  if (cloudMatch) return cloudMatch[1] || null;

  // If no match, return null
  return null;
}

/**
 * Check if a URL is already a presigned URL
 */
export function isPresignedUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  return (
    url.includes('X-Goog-Signature')
    || url.includes('GoogleAccessId')
    || (url.includes('Signature=') && url.includes('Expires='))
  );
}
