import { Storage } from '@google-cloud/storage';

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || 'storycare-media';
const bucket = storage.bucket(bucketName);

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  makePublic?: boolean;
}

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
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
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
  return files.map((file) => file.name);
}

export { storage, bucket };
