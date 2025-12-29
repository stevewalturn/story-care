'use client';

/**
 * Fullscreen Media Viewer Modal
 * Displays images, videos, and audio in fullscreen with controls
 */

import { useEffect } from 'react';

type FullscreenMediaViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: string;
    mediaType: 'image' | 'video' | 'audio';
    mediaUrl: string;
    title: string;
    description?: string;
    tags?: string[];
    createdAt: string;
    aiModel?: string;
    generationPrompt?: string;
  } | null;
};

export function FullscreenMediaViewer({
  isOpen,
  onClose,
  media,
}: FullscreenMediaViewerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        title="Close (Esc)"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Media Content */}
      <div className="flex h-full w-full flex-col">
        {/* Media Display Area */}
        <div className="flex flex-1 items-center justify-center p-8">
          {media.mediaType === 'image' && (
            <img
              src={media.mediaUrl}
              alt={media.title}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}

          {media.mediaType === 'video' && (
            <video
              src={media.mediaUrl}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            >
              <track kind="captions" />
            </video>
          )}

          {media.mediaType === 'audio' && (
            <div className="w-full max-w-2xl rounded-lg bg-white/10 p-8 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600">
                  <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-center text-xl font-semibold text-white">{media.title}</h3>
              <audio
                src={media.mediaUrl}
                controls
                autoPlay
                className="w-full"
              >
                <track kind="captions" />
              </audio>
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div className="border-t border-white/10 bg-black/50 p-6 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-2 text-lg font-semibold text-white">{media.title}</h3>
            {media.description && (
              <p className="mb-3 text-sm text-gray-300">{media.description}</p>
            )}

            {media.generationPrompt && (
              <div className="mb-3 rounded-lg bg-white/5 p-3">
                <p className="text-xs font-medium text-gray-400">Generation Prompt:</p>
                <p className="mt-1 text-sm text-gray-200">{media.generationPrompt}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {media.tags && media.tags.length > 0 && media.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-300"
                >
                  {tag}
                </span>
              ))}
              {media.aiModel && (
                <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                  {media.aiModel}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(media.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
