'use client';

/**
 * Media Tab Component
 * Displays media grid with filters for session media library
 */

import type { MediaTabProps } from '../types/transcript.types';
import type { MediaDetailsData } from '@/components/media/MediaDetailsModal';
import {
  Download,
  Edit,
  ExternalLink,
  Eye,
  Film,
  Image,
  MoreVertical,
  Music,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditMediaModal } from '@/components/media/EditMediaModal';
import { ExtractLastFrameModal } from '@/components/media/ExtractLastFrameModal';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateVideoModal } from '@/components/media/GenerateVideoModal';
import { MediaDetailsModal } from '@/components/media/MediaDetailsModal';
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
  const [selectedMedia, setSelectedMedia] = useState<MediaDetailsData | null>(null);

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

  // Edit state
  const [editingMedia, setEditingMedia] = useState<any | null>(null);

  // Extract frame state
  const [extractingMedia, setExtractingMedia] = useState<any | null>(null);

  // Animate image state
  const [animatingMedia, setAnimatingMedia] = useState<any | null>(null);

  // Regenerate media state (for "Generate New Version")
  const [regeneratingMedia, setRegeneratingMedia] = useState<any | null>(null);

  // Context menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  // Poll for in-progress tasks - only when there are active tasks
  useEffect(() => {
    // Initial load to check for any in-progress tasks
    loadInProgressTasks();
  }, [sessionId, user, refreshKey]);

  // Set up polling only when there are in-progress tasks
  useEffect(() => {
    // Only poll if we have active tasks
    if (inProgressTasks.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      loadInProgressTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, [inProgressTasks.length, sessionId, user]);

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

  // Close context menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setMenuPosition(null);
      }
    };

    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPosition(null);
    };

    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuId]);

  // Handle view details
  const handleViewDetails = (item: any) => {
    setActiveMenuId(null);
    setSelectedMedia(item);
  };

  // Handle edit details
  const handleEditDetails = (item: any) => {
    setActiveMenuId(null);
    setEditingMedia(item);
  };

  // Handle download
  const handleDownload = async (item: any) => {
    setActiveMenuId(null);
    try {
      const mediaUrl = getMediaUrl(item.mediaUrl);
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = item.mediaType === 'image' ? 'png' : item.mediaType === 'video' ? 'mp4' : 'mp3';
      a.download = `${item.title?.replace(/[^a-z0-9]/gi, '_') || 'media'}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      const mediaUrl = getMediaUrl(item.mediaUrl);
      window.open(mediaUrl, '_blank');
    }
  };

  // Handle extract last frame (video only) - opens modal
  const handleExtractFrame = (item: any) => {
    setActiveMenuId(null);
    setExtractingMedia(item);
  };

  // Perform the actual frame extraction API call
  const performExtractFrame = async () => {
    if (!extractingMedia) return;

    const response = await authenticatedFetch(`/api/media/${extractingMedia.id}/extract-frame`, user, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      // Refresh media list to show new image
      if (onTaskComplete) {
        onTaskComplete();
      }
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to extract frame');
    }
  };

  // Handle animate image (image only - opens video generation with reference)
  const handleAnimate = (item: any) => {
    setActiveMenuId(null);
    setAnimatingMedia(item);
  };

  // Handle video generated from animation
  const handleAnimationGenerated = (videoUrl: string, _prompt: string) => {
    // Refresh media list to show the new video
    if (onTaskComplete) {
      onTaskComplete();
    }
    setAnimatingMedia(null);
    // Optionally show the new video
    console.log('Video generated:', videoUrl);
  };

  // Handle generate new version (re-run with original prompt)
  const handleGenerateNewVersion = (item: any) => {
    setActiveMenuId(null);
    if (!item.generationPrompt) {
      alert('No generation prompt available for this media.');
      return;
    }
    setRegeneratingMedia(item);
  };

  // Handle image regeneration complete
  const handleImageRegenerated = async () => {
    // Refresh media list to show the new image
    if (onTaskComplete) {
      onTaskComplete();
    }
    setRegeneratingMedia(null);
  };

  // Handle save edited media
  const handleSaveMedia = async (updates: Partial<any>) => {
    if (!editingMedia) return;

    try {
      const response = await authenticatedFetch(`/api/media/${editingMedia.id}`, user, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with new values
        setMedia(prev => prev.map(m => m.id === editingMedia.id ? { ...m, ...data.media } : m));
        setEditingMedia(null);
      } else {
        throw new Error('Failed to update media');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
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
                className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white transition-all hover:border-purple-300 hover:shadow-md"
                onClick={() => setSelectedMedia(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
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
                </div>

                {/* Context Menu Button - positioned relative to card, not thumbnail */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    ref={(el) => {
                      if (el) menuButtonRefs.current.set(item.id, el);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeMenuId === item.id) {
                        setActiveMenuId(null);
                        setMenuPosition(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const menuWidth = 192; // w-48 = 12rem = 192px
                        const menuHeight = 280; // approximate menu height
                        const viewportHeight = window.innerHeight;

                        // Calculate left position - prefer right-aligned, but flip if near right edge
                        let left = rect.right - menuWidth;
                        if (left < 8) {
                          left = rect.left;
                        }

                        // Calculate top position - prefer below, but flip if near bottom
                        let top = rect.bottom + 4;
                        if (top + menuHeight > viewportHeight - 8) {
                          top = rect.top - menuHeight - 4;
                        }

                        setMenuPosition({ top, left });
                        setActiveMenuId(item.id);
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600" />
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

      {/* Portal-based Dropdown Menu */}
      {activeMenuId && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const item = media.find(m => m.id === activeMenuId);
            if (!item) return null;
            return (
              <>
                {/* View Details */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                    setMenuPosition(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                  View Details
                </button>

                {/* Edit Details */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDetails(item);
                    setMenuPosition(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                  Edit Details
                </button>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                    setMenuPosition(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 text-gray-400" />
                  Download
                </button>

                <div className="my-1 border-t border-gray-100" />

                {/* Extract Last Frame (video only) */}
                {item.mediaType === 'video' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExtractFrame(item);
                      setMenuPosition(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Image className="h-4 w-4 text-gray-400" />
                    Extract Last Frame
                  </button>
                )}

                {/* Animate (image only) */}
                {item.mediaType === 'image' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnimate(item);
                      setMenuPosition(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Film className="h-4 w-4 text-gray-400" />
                    Animate
                  </button>
                )}

                {/* Generate New Version - images only */}
                {item.mediaType === 'image' && item.generationPrompt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateNewVersion(item);
                      setMenuPosition(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Sparkles className="h-4 w-4 text-gray-400" />
                    Generate New Version
                  </button>
                )}

                <div className="my-1 border-t border-gray-100" />

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(null);
                    setMenuPosition(null);
                    setDeletingMedia(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            );
          })()}
        </div>,
        document.body,
      )}

      {/* Media Details Modal */}
      <MediaDetailsModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        media={selectedMedia}
        onEdit={() => {
          // Close details modal and open edit modal
          if (selectedMedia) {
            setEditingMedia(selectedMedia);
            setSelectedMedia(null);
          }
        }}
      />

      {/* Edit Media Modal */}
      {editingMedia && (
        <EditMediaModal
          isOpen={true}
          onClose={() => setEditingMedia(null)}
          media={editingMedia}
          onSave={handleSaveMedia}
        />
      )}

      {/* Extract Last Frame Modal */}
      <ExtractLastFrameModal
        isOpen={!!extractingMedia}
        onClose={() => setExtractingMedia(null)}
        video={extractingMedia}
        onExtract={performExtractFrame}
        onFrameExtracted={(newMedia) => {
          // Add the new media to the list
          setMedia(prev => [newMedia, ...prev]);
        }}
      />

      {/* Generate Video Modal (for animating images) */}
      <GenerateVideoModal
        isOpen={!!animatingMedia}
        onClose={() => setAnimatingMedia(null)}
        onGenerate={handleAnimationGenerated}
        sessionId={sessionId}
        patientId={selectedPatient !== 'all' ? selectedPatient : undefined}
        referenceImage={animatingMedia ? {
          id: animatingMedia.id,
          url: getMediaUrl(animatingMedia.mediaUrl),
          title: animatingMedia.title || 'Image',
        } : undefined}
      />

      {/* Generate Image Modal (for regenerating images) */}
      {regeneratingMedia?.mediaType === 'image' && (
        <GenerateImageModal
          isOpen={true}
          onClose={() => setRegeneratingMedia(null)}
          onGenerate={handleImageRegenerated}
          initialPrompt={regeneratingMedia.generationPrompt || ''}
          patientId={selectedPatient !== 'all' ? selectedPatient : undefined}
          sessionId={sessionId}
        />
      )}

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
