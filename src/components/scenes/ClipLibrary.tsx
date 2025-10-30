'use client';

import { Search, Image as ImageIcon, Video, Music, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

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

  // Mock media library
  const mockMedia: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      title: 'Hope Rising',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
    },
    {
      id: '2',
      type: 'image',
      title: 'Inner Peace',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
    {
      id: '3',
      type: 'video',
      title: 'Journey of Healing',
      thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
      duration: 125,
    },
    {
      id: '4',
      type: 'video',
      title: 'Overcoming Challenges',
      thumbnailUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=200&h=200&fit=crop',
      duration: 95,
    },
    {
      id: '5',
      type: 'audio',
      title: 'Reflection Background',
      thumbnailUrl: '',
      duration: 180,
    },
    {
      id: '6',
      type: 'image',
      title: 'Growth & Transformation',
      thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop',
    },
  ];

  const filteredMedia = mockMedia.filter((item) => {
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
          icon={<Search className="w-4 h-4" />}
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
        <div className="space-y-2">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  {item.type === 'audio' ? (
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
        </div>

        {filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No media found</p>
          </div>
        )}
      </div>
    </div>
  );
}
