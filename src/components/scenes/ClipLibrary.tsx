'use client';

import { Search, Image as ImageIcon, Video, Music, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';

interface MediaItem {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  duration?: number;
}

interface ClipLibraryProps {
  onAddToTimeline: (media: MediaItem, duration: number) => void;
}

export function ClipLibrary({ onAddToTimeline }: ClipLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch media from API
  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();

      // Transform API data to MediaItem format
      const transformedMedia: MediaItem[] = data.media.map((item: any) => ({
        id: item.id,
        type: item.mediaType,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl || '',
        duration: item.durationSeconds,
      }));

      setMedia(transformedMedia);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Media Library</h3>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search media..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('image')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'image'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setFilterType('video')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'video'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setFilterType('audio')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'audio'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Audio
        </button>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {item.type === 'audio' || !item.thumbnailUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
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
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddToTimeline(item, item.duration || 5)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredMedia.length === 0 && !loading && (
              <div className="text-center py-12">
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
