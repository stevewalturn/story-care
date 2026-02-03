'use client';

/**
 * Extract Last Frame Modal
 * Allows users to extract the last frame from a video as an image
 * Uses async Cloud Run Jobs for FFmpeg processing
 */

import type { User } from 'firebase/auth';
import { CheckCircle, Image, Info, Loader2, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
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
  user: User | null;
};

// Timeout constants
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes total timeout
const STALE_PROGRESS_TIMEOUT_MS = 60 * 1000; // 60 seconds without progress change

// Map backend step descriptions to human-friendly labels
function getHumanReadableStep(step: string): string {
  const stepMap: Record<string, string> = {
    'Initializing frame extraction': 'Starting...',
    'Initializing': 'Starting...',
    'Downloading video': 'Downloading video...',
    'Video downloaded': 'Processing video...',
    'Extracting last frame with FFmpeg': 'Extracting frame...',
    'Frame extracted': 'Frame extracted...',
    'Uploading frame to GCS': 'Uploading...',
    'Frame uploaded': 'Saving to library...',
    'Creating media record': 'Almost done...',
    'Frame extraction completed': 'Complete!',
  };
  return stepMap[step] || step || 'Processing...';
}

export function ExtractLastFrameModal({
  isOpen,
  onClose,
  video,
  onExtract,
  onFrameExtracted,
  user,
}: ExtractLastFrameModalProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFrame, setExtractedFrame] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timeout tracking refs
  const pollStartTimeRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastProgressTimeRef = useRef<number | null>(null);

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

      // Initialize timeout tracking
      pollStartTimeRef.current = Date.now();
      lastProgressRef.current = 0;
      lastProgressTimeRef.current = Date.now();

      // Start the extraction job
      const result = await onExtract();

      // Check if this is the new async response with jobId
      if (result?.jobId && result?.status === 'processing') {
        // Async flow - poll for completion using video_processing_jobs
        setStatusMessage(result.message || 'Processing video...');

        const { jobId, mediaId } = result;

        // Poll for job completion using authenticated fetch
        pollIntervalRef.current = setInterval(async () => {
          try {
            // Check for overall timeout (5 minutes)
            if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > POLL_TIMEOUT_MS) {
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              setError('Frame extraction timed out. The processing server may be temporarily unavailable. Please try again.');
              setIsExtracting(false);
              setStatusMessage('');
              setProgress(0);
              setCurrentStep('');
              return;
            }

            const statusResponse = await authenticatedFetch(
              `/api/media/${mediaId}/extract-frame/status?jobId=${jobId}`,
              user,
            );
            const statusData = await statusResponse.json();

            // Update progress tracking
            const progressValue = statusData.progress || 0;
            setProgress(progressValue);
            const stepDescription = getHumanReadableStep(statusData.currentStep || '');
            setCurrentStep(stepDescription);

            // Check for stale progress (stuck at same step)
            if (progressValue !== lastProgressRef.current) {
              lastProgressRef.current = progressValue;
              lastProgressTimeRef.current = Date.now();
            } else if (lastProgressTimeRef.current && Date.now() - lastProgressTimeRef.current > STALE_PROGRESS_TIMEOUT_MS) {
              // Progress hasn't changed for 60 seconds while in Initializing/Starting state
              const isInitializing = stepDescription.includes('Starting') || (statusData.currentStep || '').includes('Initializing');
              if (isInitializing && progressValue < 10) {
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;
                setError('Frame extraction appears to be stuck. The processing server may have failed to start. Please try again.');
                setIsExtracting(false);
                setStatusMessage('');
                setProgress(0);
                setCurrentStep('');
                return;
              }
            }

            if (statusData.status === 'completed') {
              // Job completed - stop polling
              clearInterval(pollIntervalRef.current!);
              pollIntervalRef.current = null;
              setProgress(100);
              setCurrentStep('Complete!');
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
              setProgress(0);
              setCurrentStep('');
            } else {
              // Still processing - update status message
              setStatusMessage(stepDescription);
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
    // Clean up polling if active (but job continues in background)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Reset timeout tracking
    pollStartTimeRef.current = null;
    lastProgressRef.current = 0;
    lastProgressTimeRef.current = null;
    // Reset UI state
    setExtractedFrame(null);
    setError(null);
    setIsExtracting(false);
    setStatusMessage('');
    setProgress(0);
    setCurrentStep('');
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
          {isExtracting && (
            <div className="space-y-3">
              <div className="rounded-lg bg-purple-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-700">
                      {currentStep || statusMessage || 'Processing...'}
                    </p>
                    <p className="text-xs text-purple-600">This may take a moment...</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-purple-200">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-purple-600">
                  <span>{currentStep || 'Starting...'}</span>
                  <span>
                    {progress}
                    %
                  </span>
                </div>
              </div>
              {/* Info message about closing modal */}
              <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <p>
                  Closing this modal will not cancel the extraction. Progress will be shown in the media library.
                </p>
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
