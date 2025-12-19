'use client';

/**
 * Media Tab Component
 * Displays media grid with filters for session media library
 */

import type { MediaTabProps } from '../types/transcript.types';
import { useEffect, useState } from 'react';
import { Music, RefreshCw, Trash2 } from 'lucide-react';
import { FullscreenMediaViewer } from '@/components/media/FullscreenMediaViewer';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

export function MediaTab({
  sessionId,
  user,
  onOpenUpload,
  refreshKey,
}: MediaTabProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [fullscreenMedia, setFullscreenMedia] = useState<any | null>(null);

  // Music generation polling state
  const [inProgressTasks, setInProgressTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Delete state
  const [deletingMedia, setDeletingMedia] = useState<any | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  // Load media for this session
  useEffect(() => {
    const loadMedia = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          sessionId,
        });

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
  }, [sessionId, filterType, searchQuery, user, refreshKey]);

  // Load in-progress music tasks
  const loadInProgressTasks = async () => {
    if (!user) return;

    try {
      setIsLoadingTasks(true);

      // First fetch the session to get the patientId
      const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
      if (!sessionResponse.ok) return;

      const sessionData = await sessionResponse.json();
      const patientId = sessionData.session.patientId;

      if (!patientId) return;

      // Fetch in-progress tasks for this patient
      const params = new URLSearchParams({
        patientId,
        status: 'pending,processing',
      });

      const response = await authenticatedFetch(`/api/ai/music-tasks?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setInProgressTasks(data.tasks || []);
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

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    }
    if (diffDays === 1) {
      return '1 day ago';
    }
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
    return `${Math.floor(diffDays / 365)} years ago`;
  };

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
      {/* Controls */}
      <div className="space-y-3 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Media (
            {media.length}
            )
          </h3>
          <div className="flex gap-2">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-gray-200 py-1.5 pr-3 pl-8 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <svg className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
          >
            <option>All Sources</option>
            <option>Generated</option>
            <option>Uploaded</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={filterType === 'video' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Videos
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={filterType === 'image' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={filterType === 'audio' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Music
          </button>
        </div>
      </div>

      {/* In-Progress Music Tasks Banner */}
      {inProgressTasks.length > 0 && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">
                Music Generation
                {' '}
                (
                {inProgressTasks.length}
                {' '}
                in progress)
              </span>
            </div>
            <button
              onClick={loadInProgressTasks}
              disabled={isLoadingTasks}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingTasks ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            {inProgressTasks.map(task => (
              <div key={task.id} className="rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{task.title || 'Untitled Track'}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{getTimeElapsed(task.createdAt)}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${task.progressPercentage || 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Task ID: {task.id.substring(0, 8)}...</span>
                  <span>{task.progressPercentage || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No media yet for this session</p>
            <p className="mt-1 text-xs text-gray-500">Generated content will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {media.map(item => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video cursor-pointer bg-gray-100"
                  onClick={() => setFullscreenMedia(item)}
                >
                  {item.mediaType === 'video'
                    ? (
                        <>
                          <img
                            src={item.thumbnailUrl || item.mediaUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-colors group-hover:bg-indigo-600">
                              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </div>
                          {/* Delete button for videos */}
                          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingMedia(item);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-red-50"
                              title="Delete media"
                            >
                              <Trash2 className="h-4 w-4 text-gray-700 transition-colors hover:text-red-600" />
                            </button>
                          </div>
                        </>
                      )
                    : item.mediaType === 'image'
                      ? (
                          <>
                            <img
                              src={item.thumbnailUrl || item.mediaUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                            {/* Fullscreen and Delete overlay icons */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingMedia(item);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-red-50"
                                title="Delete media"
                              >
                                <Trash2 className="h-4 w-4 text-gray-700 transition-colors hover:text-red-600" />
                              </button>
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </div>
                            </div>
                          </>
                        )
                      : (
                          <div className="relative flex h-full items-center justify-center">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            {/* Delete button for audio */}
                            <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingMedia(item);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-red-50"
                                title="Delete media"
                              >
                                <Trash2 className="h-4 w-4 text-gray-700 transition-colors hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="mb-1 line-clamp-1 text-sm font-medium text-gray-900">
                    {item.title}
                  </h4>
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="capitalize">{item.mediaType}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {item.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {item.tags && item.tags.length > 0 && item.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.sourceType && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {item.sourceType.replace('_', ' ')}
                      </span>
                    )}
                  </div>
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Delete Media</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to delete "
              {deletingMedia.title}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingMedia(null)}
                disabled={isDeletingMedia}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
