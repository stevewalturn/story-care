'use client';

/**
 * Media Tab Component
 * Displays media grid with filters for session media library
 */

import type { MediaTabProps } from '../types/transcript.types';
import { useEffect, useState } from 'react';
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

  // Get counts by type
  const videosCount = media.filter(m => m.mediaType === 'video').length;
  const imagesCount = media.filter(m => m.mediaType === 'image').length;
  const audioCount = media.filter(m => m.mediaType === 'audio').length;

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
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create
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
            All (
            {media.length}
            )
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={filterType === 'video' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Videos (
            {videosCount}
            )
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={filterType === 'image' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Images (
            {imagesCount}
            )
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={filterType === 'audio' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
          >
            Music (
            {audioCount}
            )
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No media yet for this session</p>
            <p className="mt-1 text-xs text-gray-400">Generated content will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {media.map(item => (
              <div
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
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
                        </>
                      )
                    : item.mediaType === 'image'
                      ? (
                          <img
                            src={item.thumbnailUrl || item.mediaUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        )
                      : (
                          <div className="flex h-full items-center justify-center">
                            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
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
    </>
  );
}
