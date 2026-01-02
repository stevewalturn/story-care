'use client';

/**
 * Media Tab Component
 * Displays media grid with filters for session media library
 */

import type { MediaTabProps } from '../types/transcript.types';
import { ExternalLink, Music, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FullscreenMediaViewer } from '@/components/media/FullscreenMediaViewer';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

// Helper to get presigned URL for GCS paths
const getMediaUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // If it's already a full URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Otherwise, it's a GCS path - use presigned URL endpoint
  return `/api/media/signed-url?path=${encodeURIComponent(url)}`;
};

export function MediaTab({
  sessionId,
  user,
  onOpenUpload: _onOpenUpload,
  refreshKey,
  mediaFilter = 'all',
  selectedPatient = 'all',
  onTaskComplete,
}: MediaTabProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, _setSearchQuery] = useState('');
  const [fullscreenMedia, setFullscreenMedia] = useState<any | null>(null);

  // Convert mediaFilter prop to API filter type
  const filterType = (() => {
    switch (mediaFilter) {
      case 'videos': return 'video';
      case 'images': return 'image';
      case 'musics': return 'audio';
      default: return 'all';
    }
  })();

  // Music generation polling state
  const [inProgressTasks, setInProgressTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Track previous tasks to detect completion
  const prevTasksRef = useRef<any[]>([]);

  // Delete state
  const [deletingMedia, setDeletingMedia] = useState<any | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  // Load media for the selected patient (patient-centric, not session-centric)
  useEffect(() => {
    const loadMedia = async () => {
      // Only load media if a patient is selected
      if (!selectedPatient || selectedPatient === 'all') {
        setMedia([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        // Filter by selected patient (required - patient owns the media)
        params.append('patientId', selectedPatient);

        if (filterType !== 'all') {
          params.append('type', filterType);
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await authenticatedFetch(`/api/media?${params.toString()}`, user);

        if (response.ok) {
          const data = await response.json();
          setMedia(data.media || []);
        }
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [selectedPatient, filterType, searchQuery, user, refreshKey, mediaFilter]);

  // Load in-progress music tasks
  const loadInProgressTasks = async () => {
    if (!user) return;

    try {
      setIsLoadingTasks(true);

      // Fetch in-progress tasks for this session (optimized - single API call)
      const params = new URLSearchParams({
        sessionId,
        status: 'pending,processing',
      });

      const response = await authenticatedFetch(`/api/ai/music-tasks?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        const currentTasks = data.tasks || [];

        // Detect if any tasks completed (disappeared from in-progress list)
        if (onTaskComplete && prevTasksRef.current.length > 0) {
          const currentTaskIds = new Set(currentTasks.map((t: any) => t.id));
          const completedTasks = prevTasksRef.current.filter(
            (prevTask: any) => !currentTaskIds.has(prevTask.id),
          );

          // If tasks disappeared (completed or timed out), refresh media
          if (completedTasks.length > 0) {
            console.log(`[MediaTab] ${completedTasks.length} task(s) completed, refreshing media...`);
            onTaskComplete();
          }
        }

        // Update state and ref
        prevTasksRef.current = currentTasks;
        setInProgressTasks(currentTasks);
      }
    } catch (error) {
      console.error('Error loading in-progress tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Poll for in-progress tasks every 5 seconds
  useEffect(() => {
    // Initial load
    loadInProgressTasks();

    // Set up polling interval
    const interval = setInterval(() => {
      loadInProgressTasks();
    }, 5000);

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(interval);
  }, [sessionId, user, refreshKey]);

  // Helper function to calculate time elapsed for tasks
  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((now - created) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
    return `${Math.floor(diffSeconds / 3600)}h`;
  };

  // Handle delete media
  const handleDeleteMedia = async (mediaId: string) => {
    try {
      setIsDeletingMedia(true);
      const response = await authenticatedFetch(`/api/media/${mediaId}`, user, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately
        setMedia(prev => prev.filter(m => m.id !== mediaId));
        setDeletingMedia(null);
      } else {
        throw new Error('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media. Please try again.');
    } finally {
      setIsDeletingMedia(false);
    }
  };

  return (
    <>

      {/* In-Progress Music Tasks */}
      {inProgressTasks.length > 0 && (
        <>
          {/* Subtle Header */}
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Music className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-medium text-gray-600">
                Generating music
              </span>
            </div>
            <button
              onClick={loadInProgressTasks}
              disabled={isLoadingTasks}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingTasks ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Gradient Progress Cards */}
          <div className="mb-6 space-y-4">
            {inProgressTasks.map(task => (
              <div
                key={task.id}
                className={`relative overflow-hidden rounded-2xl p-4 shadow-md transition-all duration-500 ${
                  task.status === 'pending'
                    ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 shadow-amber-100'
                    : 'animate-pulse-subtle bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 shadow-purple-100'
                }`}
              >
                {/* Shimmer overlay when processing */}
                {task.status === 'processing' && (
                  <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}

                <div className="relative z-10">
                  {/* Title with circular icon */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        task.status === 'pending' ? 'bg-amber-100' : 'bg-purple-100'
                      }`}
                      >
                        <Music className={`h-4 w-4 ${
                          task.status === 'pending' ? 'text-amber-600' : 'text-purple-600'
                        }`}
                        />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {task.title || 'Untitled Track'}
                      </h4>
                    </div>

                    {/* Glass morphism badge */}
                    <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                      task.status === 'pending'
                        ? 'bg-white/80 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-white/80 text-purple-700 ring-1 ring-purple-200'
                    }`}
                    >
                      {task.status === 'pending' ? 'Pending' : 'Processing'}
                    </span>
                  </div>

                  {/* Large progress bar with % inside */}
                  <div className="relative mb-3">
                    <div className={`h-3 w-full overflow-hidden rounded-full ${
                      task.status === 'pending' ? 'bg-amber-100' : 'bg-purple-100'
                    }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          task.status === 'pending'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-bold text-gray-700">
                        {task.progress || 0}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Time with clock icon */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Started
                      {getTimeElapsed(task.createdAt)}
                      {' '}
                      ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Media Grid - 2-column layout matching Figma */}
      <div className="flex-1 overflow-y-auto bg-white p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">No media yet for this session</p>
            <p className="mt-1 text-xs text-gray-500">Generated content will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {media.map(item => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-purple-300 hover:shadow-md"
                onClick={() => setFullscreenMedia(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-gray-100">
                  {item.mediaType === 'video' ? (
                    <>
                      {item.thumbnailUrl ? (
                        <img
                          src={getMediaUrl(item.thumbnailUrl)}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-purple-100 to-purple-200" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      {/* Scene badge for compiled videos */}
                      {item.sourceType === 'scene' && (
                        <span className="absolute top-2 left-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                          Scene
                        </span>
                      )}
                    </>
                  ) : item.mediaType === 'image' ? (
                    <img
                      src={getMediaUrl(item.thumbnailUrl || item.mediaUrl)}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-50">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                  {/* 3-dot menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingMedia(item);
                    }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {/* Title and Scene Link */}
                <div className="p-2">
                  <h4 className="line-clamp-2 text-xs font-medium text-gray-700">
                    {item.title}
                  </h4>
                  {/* View Scene button for scene-generated videos */}
                  {item.sourceType === 'scene' && item.sceneId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/scenes?highlight=${item.sceneId}`;
                      }}
                      className="mt-1 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Scene
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Media Viewer */}
      <FullscreenMediaViewer
        isOpen={!!fullscreenMedia}
        onClose={() => setFullscreenMedia(null)}
        media={fullscreenMedia}
      />

      {/* Delete Confirmation Dialog */}
      {deletingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-50">Delete Media</h3>
            <p className="mb-4 text-sm text-gray-300">
              Are you sure you want to delete "
              {deletingMedia.title}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingMedia(null)}
                disabled={isDeletingMedia}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMedia(deletingMedia.id)}
                disabled={isDeletingMedia}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingMedia ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
