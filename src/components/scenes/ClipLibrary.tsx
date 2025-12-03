'use client';

import { Image as ImageIcon, Music, Plus, Search, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type MediaItem = {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  duration?: number;
};

type ClipLibraryProps = {
  onAddToTimeline: (media: MediaItem, duration: number) => void;
  patientId?: string;
};

export function ClipLibrary({ onAddToTimeline, patientId }: ClipLibraryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch media from API
  useEffect(() => {
    if (patientId) {
      fetchMedia();
    }
  }, [filterType, patientId]);

  // Debounced search
  useEffect(() => {
    if (patientId) {
      const timer = setTimeout(() => {
        fetchMedia();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchQuery, patientId]);

  const fetchMedia = async () => {
    if (!patientId) {
      console.log('No patientId provided, skipping media fetch');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('patientId', patientId);
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      console.log('Fetching media with params:', params.toString());
      const response = await authenticatedFetch(`/api/media?${params}`, user);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Media fetch failed:', response.status, errorText);
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      console.log('Media fetch successful:', data);

      // Transform API data to MediaItem format
      const transformedMedia: MediaItem[] = (data.media || []).map((item: any) => ({
        id: item.id,
        type: item.mediaType,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl || (item.mediaType === 'image' ? item.mediaUrl : '') || '',
        duration: item.durationSeconds,
      }));

      console.log('Transformed media items:', transformedMedia);
      setMedia(transformedMedia);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter((item) => {
    const matchesSearch
      = searchQuery === ''
        || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) {
      return '';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Media Library</h3>
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search media..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('image')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'image'
              ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setFilterType('video')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'video'
              ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setFilterType('audio')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'audio'
              ? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Audio
        </button>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map(item => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gradient-to-br from-gray-100 to-gray-200">
                    {item.type === 'audio'
                      ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music className="h-6 w-6 text-gray-400" />
                          </div>
                        )
                      : item.type === 'video'
                        ? (
                            <div className="flex h-full w-full items-center justify-center">
                              <Video className="h-6 w-6 text-gray-400" />
                            </div>
                          )
                        : (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        {getIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </span>
                      {item.duration && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Adding clip to timeline:', item);
                      onAddToTimeline(item, item.duration || 5);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            ))}

            {filteredMedia.length === 0 && !loading && (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No media found matching your search' : 'No media available'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
