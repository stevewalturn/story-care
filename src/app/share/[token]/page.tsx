/**
 * Public Share Page - Time-Limited Story Page Access
 * No authentication required - validates token and expiry
 */

import { eq } from 'drizzle-orm';
// import { redirect } from 'next/navigation'; // TODO: Implement redirect for invalid tokens
import { db } from '@/libs/DB';
import { storyPagesSchema } from '@/models/Schema';
import { StoryPageViewer } from '@/components/pages/StoryPageViewer';

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PublicSharePage({ params }: Props) {
  const { token } = await params;

  // Validate share token
  const [page] = await db
    .select()
    .from(storyPagesSchema)
    .where(eq(storyPagesSchema.shareToken, token))
    .limit(1);

  // Check if page exists
  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
            <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-600">
            This link is not valid or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  // Check if link has expired
  const now = new Date();
  const expiresAt = page.shareExpiresAt ? new Date(page.shareExpiresAt) : null;

  if (!expiresAt || now > expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
            <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Link Expired</h1>
          <p className="text-gray-600">
            This link has expired and is no longer available.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your therapist for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Check if page is shareable and published
  if (!page.isShareable || page.status !== 'published') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Not Available</h1>
          <p className="text-gray-600">
            This page is not currently available for viewing.
          </p>
        </div>
      </div>
    );
  }

  // Calculate time remaining
  const timeRemaining = expiresAt.getTime() - now.getTime();
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const hoursRemaining = Math.floor(minutesRemaining / 60);

  let expiryText = '';
  if (hoursRemaining > 0) {
    expiryText = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`;
  } else {
    expiryText = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
  }

  // Render story page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Expiry Banner */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
        <div className="mx-auto max-w-4xl">
          <p className="flex items-center gap-2 text-center text-sm text-amber-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This link will expire in {expiryText}
          </p>
        </div>
      </div>

      {/* Story Page Content */}
      <StoryPageViewer pageId={page.id} isPublicShare />
    </div>
  );
}
