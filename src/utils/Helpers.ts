export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (
    process.env.VERCEL_ENV === 'production'
    && process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

export const isServer = () => {
  return typeof window === 'undefined';
};

/**
 * Extract filename from a file path
 * Handles both Unix and Windows paths
 * Example: "/path/to/Screenshot.png" → "Screenshot.png"
 * Example: "C:\\Users\\file.txt" → "file.txt"
 */
export function extractFilename(path: string): string {
  if (!path) return path;

  // Handle both Unix (/) and Windows (\) path separators
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}
