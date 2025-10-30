'use client';

import { useState } from 'react';
import { Image as ImageIcon, Video, Music, FileText, MoreVertical, Download, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'quote';
  title: string;
  url: string;
  thumbnailUrl?: string;
  patientName?: string;
  sessionName?: string;
  createdAt: Date;
  duration?: number; // for video/audio in seconds
  text?: string; // for quotes
}

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDelete: (itemId: string) => void;
}

export function MediaGrid({ items, onItemClick, onDelete }: MediaGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'quote':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-700';
      case 'video':
        return 'bg-purple-100 text-purple-700';
      case 'audio':
        return 'bg-green-100 text-green-700';
      case 'quote':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white"
          onClick={() => onItemClick(item)}
        >
          {/* Thumbnail / Preview */}
          <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
            {item.type === 'image' && item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : item.type === 'video' && item.thumbnailUrl ? (
              <>
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
              </>
            ) : item.type === 'quote' && item.text ? (
              <div className="p-4 flex items-center justify-center">
                <p className="text-sm text-gray-700 italic line-clamp-6 text-center">
                  "{item.text}"
                </p>
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getTypeColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
            )}

            {/* Duration badge */}
            {item.duration && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                {formatDuration(item.duration)}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button variant="primary" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-1 flex-1">
                {item.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(selectedId === item.id ? null : item.id);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Meta info */}
            <div className="space-y-1">
              {item.patientName && (
                <p className="text-xs text-gray-600">
                  Patient: {item.patientName}
                </p>
              )}
              {item.sessionName && (
                <p className="text-xs text-gray-600 line-clamp-1">
                  From: {item.sessionName}
                </p>
              )}
              <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
            </div>

            {/* Type badge */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                {getIcon(item.type)}
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
            </div>
          </div>

          {/* Action menu */}
          {selectedId === item.id && (
            <div className="absolute top-12 right-3 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Download functionality
                  setSelectedId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                  setSelectedId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <div className="col-span-full text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No media files yet</p>
          <p className="text-sm text-gray-500">
            Generate or upload media to see it here
          </p>
        </div>
      )}
    </div>
  );
}
