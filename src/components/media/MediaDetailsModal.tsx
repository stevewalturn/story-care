'use client';

/**
 * Media Details Modal
 * Displays comprehensive metadata for images, videos, and audio in a side-by-side layout
 */

import { Download, ExternalLink, Image, Music, Pencil, Video, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../ui/Button';

// Helper to check if a string is JSON (legacy metadata stored in notes)
const isJsonString = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export type MediaDetailsData = {
  id: string;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  title: string;
  description?: string;
  status?: string;
  generationPrompt?: string;
  sceneTitle?: string;
  patientName?: string;
  tags?: string[];
  notes?: string;
  aiModel?: string;
  createdAt: string;
  durationSeconds?: number;
  generationMetadata?: Record<string, unknown>; // AI generation parameters
};

type MediaDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  media: MediaDetailsData | null;
  onEdit?: () => void; // Callback to open edit modal
};

export function MediaDetailsModal({
  isOpen,
  onClose,
  media,
  onEdit,
}: MediaDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  // Parse generation metadata from dedicated field
  const parsedMetadata = media.generationMetadata as {
    type?: 'instrumental' | 'lyrical';
    instrumental?: boolean;
    model?: string;
    mood?: string;
    style?: string;
    width?: number;
    height?: number;
    seed?: number;
    clipCount?: number;
    audioTrackCount?: number;
    extractedFrom?: string;
    sourceVideoTitle?: string;
    fps?: number;
    duration?: number;
    referenceImageUsed?: boolean;
    generatedAt?: string;
  } | null;

  // Determine audio type (lyrical/instrumental)
  const getAudioType = (): 'Lyrical' | 'Instrumental' | null => {
    if (media.mediaType !== 'audio') return null;

    // 1. Check notes JSON for explicit type
    if (parsedMetadata?.type) {
      return parsedMetadata.type === 'instrumental' ? 'Instrumental' : 'Lyrical';
    }
    if (parsedMetadata?.instrumental !== undefined) {
      return parsedMetadata.instrumental ? 'Instrumental' : 'Lyrical';
    }

    // 2. Check tags for lyrical/instrumental
    if (media.tags?.includes('instrumental')) return 'Instrumental';
    if (media.tags?.includes('lyrical')) return 'Lyrical';

    // 3. FALLBACK: Infer from generation prompt (for backwards compatibility)
    if (media.generationPrompt) {
      const lyricsMarkers = ['[Verse', '[Chorus]', '[Bridge]', '[Pre-Chorus]', '[Outro]', '[Intro]', '[Hook]'];
      const hasLyrics = lyricsMarkers.some(marker =>
        media.generationPrompt!.includes(marker),
      );
      return hasLyrics ? 'Lyrical' : 'Instrumental';
    }

    return null;
  };

  const audioType = getAudioType();

  // Get icon based on media type
  const getMediaIcon = () => {
    switch (media.mediaType) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <Image className="h-5 w-5" />;
    }
  };

  // Handle download
  const handleDownload = async () => {
    try {
      let downloadUrl = media.mediaUrl;

      // If it's a GCS path, get signed URL first
      if (!media.mediaUrl.startsWith('http')) {
        const signedUrlResponse = await fetch(
          `/api/media/signed-url?path=${encodeURIComponent(media.mediaUrl)}`,
        );
        if (signedUrlResponse.ok) {
          const data = await signedUrlResponse.json();
          downloadUrl = data.signedUrl || data.url;
        }
      }

      // Now fetch and download
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Generate filename from title
      const extension = media.mediaType === 'image' ? 'png' : media.mediaType === 'video' ? 'mp4' : 'mp3';
      a.download = `${media.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try to open signed URL
      if (!media.mediaUrl.startsWith('http')) {
        window.open(`/api/media/signed-url?path=${encodeURIComponent(media.mediaUrl)}&redirect=true`, '_blank');
      } else {
        window.open(media.mediaUrl, '_blank');
      }
    }
  };

  // Handle open in new tab
  const handleOpen = () => {
    if (!media.mediaUrl.startsWith('http')) {
      // Use signed URL for GCS paths
      window.open(`/api/media/signed-url?path=${encodeURIComponent(media.mediaUrl)}&redirect=true`, '_blank');
    } else {
      window.open(media.mediaUrl, '_blank');
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-gray-700">
            {getMediaIcon()}
            <h3 className="text-lg font-semibold text-gray-900">Media Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - Side by side layout */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Left side - Media Preview */}
          <div className="flex w-full flex-shrink-0 items-center justify-center bg-gray-100 p-4 md:w-1/2">
            {media.mediaType === 'image' && (
              <img
                src={media.mediaUrl}
                alt={media.title}
                className="max-h-[400px] max-w-full rounded-lg object-contain shadow-md"
              />
            )}

            {media.mediaType === 'video' && (
              <video
                src={media.mediaUrl}
                controls
                className="max-h-[400px] max-w-full rounded-lg shadow-md"
              >
                <track kind="captions" />
              </video>
            )}

            {media.mediaType === 'audio' && (
              <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{media.title}</h4>
                    <p className="text-sm text-gray-500">Audio Track</p>
                  </div>
                </div>
                <audio
                  src={media.mediaUrl}
                  controls
                  className="w-full"
                >
                  <track kind="captions" />
                </audio>
                {media.durationSeconds && (
                  <div className="mt-2 text-right">
                    <button className="text-sm text-purple-600 hover:text-purple-700">
                      <Download className="mr-1 inline h-4 w-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Metadata */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Status */}
              {media.status && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    media.status === 'completed'
                      ? 'bg-gray-800 text-white'
                      : media.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                  >
                    {media.status.charAt(0).toUpperCase() + media.status.slice(1)}
                  </span>
                </div>
              )}

              {/* Audio Type (Lyrical/Instrumental) */}
              {audioType && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    audioType === 'Instrumental'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  >
                    {audioType}
                  </span>
                </div>
              )}

              {/* Mood (for audio) */}
              {parsedMetadata?.mood && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mood</p>
                  <p className="mt-1 text-sm text-gray-900">{parsedMetadata.mood}</p>
                </div>
              )}

              {/* Generation Prompt */}
              {media.generationPrompt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Generation Prompt</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-900">{media.generationPrompt}</p>
                </div>
              )}

              {/* Scene Title */}
              {media.sceneTitle && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Scene Title</p>
                  <p className="mt-1 text-sm text-gray-900">{media.sceneTitle}</p>
                </div>
              )}

              {/* Description */}
              {media.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-1 text-sm text-gray-900">{media.description}</p>
                </div>
              )}

              {/* Patient */}
              {media.patientName && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient</p>
                  <p className="mt-1 text-sm text-gray-900">{media.patientName}</p>
                </div>
              )}

              {/* Tags */}
              {media.tags && media.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tags</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {media.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Therapist Notes - only show if not JSON (hide legacy metadata) */}
              {media.notes && !isJsonString(media.notes) && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Therapist Notes</p>
                  <p className="mt-1 text-sm text-gray-900">{media.notes}</p>
                </div>
              )}

              {/* AI Model (if available) */}
              {media.aiModel && (
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Model</p>
                  <p className="mt-1 text-sm text-gray-900">{media.aiModel}</p>
                </div>
              )}

              {/* Duration (for video/audio) */}
              {media.durationSeconds && media.durationSeconds > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDuration(media.durationSeconds)}</p>
                </div>
              )}

              {/* Created At */}
              {media.createdAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(media.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleOpen}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            {onEdit && (
              <Button
                variant="secondary"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
