/**
 * React Hook for Polling Video Processing Job Status
 * Automatically polls job status and updates UI
 */

'use client';

import { useEffect, useState } from 'react';

interface VideoJob {
  jobId: string;
  sceneId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  assembledVideoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
}

interface UseVideoJobPollingOptions {
  jobId?: string;
  sceneId?: string;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onComplete?: (job: VideoJob) => void;
  onError?: (error: string) => void;
}

export function useVideoJobPolling({
  jobId,
  sceneId,
  enabled = true,
  pollInterval = 2000, // Poll every 2 seconds
  onComplete,
  onError,
}: UseVideoJobPollingOptions) {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't poll if not enabled or no ID provided
    if (!enabled || (!jobId && !sceneId)) {
      return;
    }

    // Don't poll if job is already completed or failed
    if (job?.status === 'completed' || job?.status === 'failed') {
      return;
    }

    let intervalId: NodeJS.Timeout;
    let isSubscribed = true;

    const fetchJobStatus = async () => {
      try {
        setLoading(true);

        // Determine endpoint based on available IDs
        const endpoint = jobId
          ? `/api/video-jobs/${jobId}`
          : `/api/scenes/${sceneId}/assemble-async`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }

        const data = await response.json();

        if (isSubscribed) {
          setJob(data.job || data);
          setError(null);

          // Call callbacks
          if (data.status === 'completed' && onComplete) {
            onComplete(data.job || data);
          }

          if (data.status === 'failed' && onError) {
            onError(data.errorMessage || 'Job failed');
          }
        }
      } catch (err: any) {
        console.error('Error fetching job status:', err);
        if (isSubscribed) {
          setError(err.message);
          if (onError) {
            onError(err.message);
          }
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Set up polling interval
    intervalId = setInterval(fetchJobStatus, pollInterval);

    // Cleanup
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [jobId, sceneId, enabled, job?.status, pollInterval, onComplete, onError]);

  return {
    job,
    loading,
    error,
    isProcessing: job?.status === 'pending' || job?.status === 'processing',
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  };
}
