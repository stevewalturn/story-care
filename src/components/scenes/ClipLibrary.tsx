'use client';

import { Image as ImageIcon, Music, Pause, Play, Plus, Search, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type MediaItem = {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  mediaUrl?: string;
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

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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

      const response = await authenticatedFetch(`/api/media?${params}`, user);

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();

      // Transform API data to MediaItem format
      const transformedMedia: MediaItem[] = (data.media || []).map((item: any) => ({
        id: item.id,
        type: item.mediaType,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl || (item.mediaType === 'image' ? item.mediaUrl : '') || '',
        mediaUrl: item.mediaUrl,
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

  // Audio playback handler
  const handleAudioPlayPause = (audioId: string) => {
    const audioElement = audioRefs.current.get(audioId);
    if (!audioElement) return;

    if (playingAudioId === audioId) {
      // Pause currently playing audio
      audioElement.pause();
      setPlayingAudioId(null);
    } else {
      // Stop any currently playing audio
      if (playingAudioId) {
        const currentAudio = audioRefs.current.get(playingAudioId);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // Play new audio
      audioElement.play();
      setPlayingAudioId(audioId);
    }
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
              ? 'border-b-2 border-purple-600 bg-purple-50 text-purple-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('image')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'image'
              ? 'border-b-2 border-purple-600 bg-purple-50 text-purple-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setFilterType('video')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'video'
              ? 'border-b-2 border-purple-600 bg-purple-50 text-purple-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setFilterType('audio')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'audio'
              ? 'border-b-2 border-purple-600 bg-purple-50 text-purple-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Audio
        </button>
      </div>

      {/* Hidden audio elements for playback */}
      {filteredMedia
        .filter(item => item.type === 'audio' && item.mediaUrl)
        .map(item => (
          <audio
            key={item.id}
            ref={(el) => {
              if (el) {
                audioRefs.current.set(item.id, el);
              }
            }}
            src={item.mediaUrl}
            onEnded={() => setPlayingAudioId(null)}
          />
        ))}

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
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
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gradient-to-br from-gray-100 to-gray-200">
                    {item.type === 'audio'
                      ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                            <Music className="h-6 w-6 text-white/60" />
                            {/* Play/Pause button overlay */}
                            {item.mediaUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAudioPlayPause(item.id);
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all hover:bg-black/30"
                                title={playingAudioId === item.id ? 'Pause' : 'Play'}
                              >
                                <div className="rounded-full bg-white p-2 shadow-lg">
                                  {playingAudioId === item.id
                                    ? (
                                        <Pause className="h-4 w-4 text-purple-600" />
                                      )
                                    : (
                                        <Play className="h-4 w-4 text-purple-600" />
                                      )}
                                </div>
                              </button>
                            )}
                          </div>
                        )
                      : item.type === 'video'
                        ? (
                            <>
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-purple-100 to-purple-200" />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="rounded-full bg-white p-1.5 shadow-lg">
                                  <Video className="h-4 w-4 text-purple-600" />
                                </div>
                              </div>
                            </>
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
