import { Storage } from '@google-cloud/storage';

// Initialize GCS client
// Cloud Run: Uses default compute service account automatically
// Local: Uses Application Default Credentials (gcloud auth application-default login)
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME || 'storycare-media';
const bucket = storage.bucket(bucketName);

export type UploadOptions = {
  folder?: string;
  contentType?: string;
  makePublic?: boolean;
};

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  filename: string,
  options: UploadOptions = {},
): Promise<{ url: string; path: string }> {
  const { folder = 'uploads', contentType = 'application/octet-stream', makePublic = false } = options;

  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '_');
  const path = `${folder}/${timestamp}-${sanitizedFilename}`;

  const fileObject = bucket.file(path);

  await fileObject.save(file, {
    contentType,
    metadata: {
      // HIPAA: PHI should not be cached publicly or for long periods
      cacheControl: makePublic ? 'public, max-age=31536000' : 'private, max-age=3600',
    },
  });

  if (makePublic) {
    await fileObject.makePublic();
    const url = `https://storage.googleapis.com/${bucketName}/${path}`;
    return { url, path };
  }

  // Generate signed URL (valid for 1 hour - HIPAA compliant for PHI)
  const [signedUrl] = await fileObject.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return { url: signedUrl, path };
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const file = bucket.file(path);
  await file.delete();
}

/**
 * Get a signed URL for a file
 * HIPAA COMPLIANCE: Short expiration for PHI access
 *
 * @param path - File path in GCS bucket
 * @param expiresInHours - Expiration time in hours (default: 1 hour)
 */
export async function getSignedUrl(
  path: string,
  expiresInHours = 1,
): Promise<string> {
  const file = bucket.file(path);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInHours * 60 * 60 * 1000, // Default 1 hour
  });
  return signedUrl;
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = bucket.file(path);
  const [exists] = await file.exists();
  return exists;
}

/**
 * List files in a folder
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map(file => file.name);
}

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

  // Handle gs:// protocol
  if (url.startsWith('gs://')) {
    const match = url.match(/^gs:\/\/[^/]+\/(.+)$/);
    return match ? match[1] || null : null;
  }

  // Handle https:// URLs from GCS
  const storageMatch = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
  if (storageMatch) return storageMatch[1] || null;

  const cloudMatch = url.match(/storage\.cloud\.google\.com\/[^/]+\/(.+)/);
  if (cloudMatch) return cloudMatch[1] || null;

  // If no match, return null
  return null;
}

/**
 * Generate presigned URL for a single URL/path
 * Safely handles null/undefined and already-signed URLs
 *
 * @param urlOrPath - GCS URL, path, or null
 * @param expiresInHours - Expiration time (default: 1 hour)
 * @returns Presigned URL or original URL if extraction fails
 */
export async function generatePresignedUrl(
  urlOrPath: string | null | undefined,
  expiresInHours = 1,
): Promise<string | null> {
  if (!urlOrPath) return null;

  // If it's already a signed URL (contains X-Goog-Signature), return as-is
  if (urlOrPath.includes('X-Goog-Signature')) {
    return urlOrPath;
  }

  const path = extractGcsPath(urlOrPath);
  if (!path) {
    // If we can't extract a path, return original URL
    console.warn(`[GCS] Could not extract path from URL: ${urlOrPath}`);
    return urlOrPath;
  }

  try {
    const signedUrl = await getSignedUrl(path, expiresInHours);
    return signedUrl;
  } catch (error) {
    console.error(`[GCS] Failed to generate signed URL for path: ${path}`, error);
    return urlOrPath; // Fallback to original URL
  }
}

/**
 * Batch generate presigned URLs for media items
 * Processes mediaUrl and thumbnailUrl fields
 *
 * @param items - Array of items with mediaUrl and/or thumbnailUrl fields
 * @param expiresInHours - Expiration time (default: 1 hour)
 * @returns Items with presigned URLs
 */
export async function generatePresignedUrlsForMedia<T extends { mediaUrl?: string | null; thumbnailUrl?: string | null }>(
  items: T[],
  expiresInHours = 1,
): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      const [signedMediaUrl, signedThumbnailUrl] = await Promise.all([
        item.mediaUrl ? generatePresignedUrl(item.mediaUrl, expiresInHours) : null,
        item.thumbnailUrl ? generatePresignedUrl(item.thumbnailUrl, expiresInHours) : null,
      ]);

      return {
        ...item,
        mediaUrl: signedMediaUrl || item.mediaUrl,
        thumbnailUrl: signedThumbnailUrl || item.thumbnailUrl,
      };
    }),
  );

  return results;
}

export { bucket, storage };
