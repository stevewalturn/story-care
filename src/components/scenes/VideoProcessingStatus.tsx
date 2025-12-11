/**
 * Video Processing Status Component
 * Shows real-time progress of async video assembly
 */

'use client';

import { useVideoJobPolling } from '@/hooks/useVideoJobPolling';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface VideoProcessingStatusProps {
  sceneId: string;
  onComplete?: (videoUrl: string, thumbnailUrl?: string) => void;
  onError?: (error: string) => void;
}

export function VideoProcessingStatus({
  sceneId,
  onComplete,
  onError,
}: VideoProcessingStatusProps) {
  const { job, loading, error, isProcessing, isCompleted, isFailed } = useVideoJobPolling({
    sceneId,
    enabled: true,
    pollInterval: 2000,
    onComplete: (job) => {
      if (job.assembledVideoUrl && onComplete) {
        onComplete(job.assembledVideoUrl, job.thumbnailUrl);
      }
    },
    onError,
  });

  if (!job && !loading && !error) {
    return null;
  }

  return (
    <div className="w-full rounded-lg border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Video Processing</h3>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isProcessing && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Processing</span>
            </>
          )}
          {isCompleted && (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Completed</span>
            </>
          )}
          {isFailed && (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Failed</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {job && isProcessing && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">{job.currentStep || 'Processing...'}</span>
            <span className="font-medium text-gray-900">{job.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step Info */}
      {job && (
        <div className="space-y-2 text-sm">
          {job.currentStep && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700">Status:</span>
              <span className="text-gray-600">{job.currentStep}</span>
            </div>
          )}

          {job.startedAt && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700">Started:</span>
              <span className="text-gray-600">
                {new Date(job.startedAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          {job.completedAt && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700">Completed:</span>
              <span className="text-gray-600">
                {new Date(job.completedAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          {job.durationSeconds && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="text-gray-600">{job.durationSeconds}s</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {(isFailed || error) && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Processing Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                {job?.errorMessage || error || 'Unknown error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message with Video Preview */}
      {isCompleted && job?.assembledVideoUrl && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Video Ready!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your scene has been assembled successfully.
              </p>
            </div>
          </div>

          {/* Video Preview */}
          {job.thumbnailUrl && (
            <div className="mt-4">
              <img
                src={job.thumbnailUrl}
                alt="Video thumbnail"
                className="h-auto w-full rounded-md border border-green-200"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <a
              href={job.assembledVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              View Video
            </a>
            <a
              href={job.assembledVideoUrl}
              download
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
