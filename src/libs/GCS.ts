import { Storage } from '@google-cloud/storage';
import { extractGcsPath as extractGcsPathUtil, isPresignedUrl as isPresignedUrlUtil } from '@/utils/GCSUtils';

// Initialize GCS client with explicit credentials for signing
// Cloud Run: Uses service account credentials
// Local: Uses service account key from environment variables
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
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

// Re-export client-safe utilities from GCSUtils
export const extractGcsPath = extractGcsPathUtil;
export const isPresignedUrl = isPresignedUrlUtil;

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

  // Decode URL in case it's been encoded multiple times
  let decodedUrl = urlOrPath;
  try {
    decodedUrl = decodeURIComponent(urlOrPath);
  } catch (e) {
    // If decoding fails, use original
    decodedUrl = urlOrPath;
  }

  // Always extract the path and regenerate the signature
  // This ensures we get a fresh signature even if the stored URL has expired
  const path = extractGcsPath(decodedUrl);
  if (!path) {
    // If we can't extract a path, return original URL
    console.warn(`[GCS] Could not extract path from URL: ${decodedUrl.substring(0, 100)}...`);
    console.warn(`[GCS] URL starts with http: ${decodedUrl.startsWith('http')}, gs: ${decodedUrl.startsWith('gs://')}`);
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

/**
 * Batch generate presigned URLs for patient reference images
 * Processes referenceImageUrl and avatarUrl fields
 *
 * @param items - Array of items with referenceImageUrl and/or avatarUrl fields
 * @param expiresInHours - Expiration time (default: 1 hour)
 * @returns Items with presigned URLs
 */
export async function generatePresignedUrlsForPatients<T extends { referenceImageUrl?: string | null; avatarUrl?: string | null }>(
  items: T[],
  expiresInHours = 1,
): Promise<T[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      const [signedReferenceUrl, signedAvatarUrl] = await Promise.all([
        item.referenceImageUrl ? generatePresignedUrl(item.referenceImageUrl, expiresInHours) : null,
        item.avatarUrl ? generatePresignedUrl(item.avatarUrl, expiresInHours) : null,
      ]);

      return {
        ...item,
        referenceImageUrl: signedReferenceUrl || item.referenceImageUrl,
        avatarUrl: signedAvatarUrl || item.avatarUrl,
      };
    }),
  );

  return results;
}

export { bucket, storage };
