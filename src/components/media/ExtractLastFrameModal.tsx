'use client';

/**
 * Extract Last Frame Modal
 * Allows users to extract the last frame from a video as an image
 * Uses async Cloud Run Jobs for FFmpeg processing
 */

import { CheckCircle, Image, Loader2, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';

type ExtractLastFrameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    mediaUrl: string;
    thumbnailUrl?: string;
  } | null;
  onExtract: () => Promise<any>;
  onFrameExtracted?: (newMedia: any) => void;
};

export function ExtractLastFrameModal({
  isOpen,
  onClose,
  video,
  onExtract,
  onFrameExtracted,
}: ExtractLastFrameModalProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFrame, setExtractedFrame] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleExtract = async () => {
    if (!video) return;

    try {
      setIsExtracting(true);
      setError(null);
      setStatusMessage('Starting extraction...');

      // Start the extraction job
      const result = await onExtract();

      // Check if this is the new async response with jobId
      if (result?.jobId && result?.status === 'processing') {
        // Async flow - poll for completion using video_processing_jobs
        setStatusMessage(result.message || 'Processing video...');

        const { jobId, mediaId } = result;

        // Poll for job completion (simplified - just need jobId)
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/media/${mediaId}/extract-frame/status?jobId=${jobId}`,
            );
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              // Job completed - stop polling
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              setIsExtracting(false);

              if (statusData.image) {
                // Frame found - show it
                setExtractedFrame(statusData.image);
                setStatusMessage('');
                onFrameExtracted?.(statusData.image);
              } else {
                // Job completed but image not found in query - show success message
                setStatusMessage('Frame extracted successfully! Refresh to see it in your media library.');
              }
            } else if (statusData.status === 'failed') {
              // Job failed
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              setError(statusData.error || 'Frame extraction failed');
              setIsExtracting(false);
              setStatusMessage('');
            } else {
              // Still processing - show progress if available
              const progressMsg = statusData.currentStep || statusData.message || 'Extracting frame...';
              const progressPct = statusData.progress ? ` (${statusData.progress}%)` : '';
              setStatusMessage(`${progressMsg}${progressPct}`);
            }
          } catch (pollError) {
            console.error('Error polling for status:', pollError);
            // Continue polling on network errors
          }
        }, 3000); // Poll every 3 seconds
      } else if (result?.image) {
        // Legacy sync response (fallback)
        setExtractedFrame(result.image);
        onFrameExtracted?.(result.image);
        setIsExtracting(false);
      } else if (result?.media) {
        // Alternative response format
        setExtractedFrame(result.media);
        onFrameExtracted?.(result.media);
        setIsExtracting(false);
      } else {
        throw new Error('Unexpected response from extraction');
      }
    } catch (err) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setError(err instanceof Error ? err.message : 'Failed to extract frame');
      setIsExtracting(false);
      setStatusMessage('');
    }
  };

  const handleClose = () => {
    // Clean up polling if active
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setExtractedFrame(null);
    setError(null);
    setIsExtracting(false);
    setStatusMessage('');
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Extract Last Frame
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          {/* Source Video Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{video.title}</p>
                <p className="text-xs text-gray-500">Source video</p>
              </div>
            </div>
          </div>

          {/* Success State */}
          {extractedFrame && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Frame extracted successfully!</p>
              </div>
              <div className="overflow-hidden rounded-lg border border-green-200">
                <img
                  src={extractedFrame.mediaUrl?.startsWith('http')
                    ? extractedFrame.mediaUrl
                    : `/api/media/signed-url?path=${encodeURIComponent(extractedFrame.mediaUrl)}`}
                  alt={extractedFrame.title}
                  className="h-40 w-full object-cover"
                />
              </div>
              <p className="text-xs text-green-600">
                The extracted frame has been added to your media library.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Processing State */}
          {isExtracting && statusMessage && (
            <div className="rounded-lg bg-purple-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-700">{statusMessage}</p>
                  <p className="text-xs text-purple-600">This may take a moment...</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {!extractedFrame && !error && !isExtracting && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p>
                This will extract the last frame from the video and save it as a new image in your media library.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <Button variant="secondary" onClick={handleClose}>
            {extractedFrame ? 'Done' : 'Cancel'}
          </Button>
          {!extractedFrame && (
            <Button
              onClick={handleExtract}
              disabled={isExtracting}
              className="flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  Extract Last Frame
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
