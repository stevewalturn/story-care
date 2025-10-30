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
      cacheControl: 'public, max-age=31536000',
    },
  });

  if (makePublic) {
    await fileObject.makePublic();
    const url = `https://storage.googleapis.com/${bucketName}/${path}`;
    return { url, path };
  }

  // Generate signed URL (valid for 7 days)
  const [signedUrl] = await fileObject.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
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
 */
export async function getSignedUrl(
  path: string,
  expiresInDays = 7,
): Promise<string> {
  const file = bucket.file(path);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
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
