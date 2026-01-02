'use client';

import { Download, Eye, FileText, Image as ImageIcon, MoreVertical, Music, Trash2, Video } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type MediaItem = {
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
};

type MediaGridProps = {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  onDelete: (itemId: string) => void;
};

export function MediaGrid({ items, onItemClick, onDelete }: MediaGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      case 'quote':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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
    if (!seconds) {
      return '';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(item => (
        <div
          key={item.id}
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
          onClick={() => onItemClick(item)}
        >
          {/* Thumbnail / Preview */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
            {item.type === 'image' && item.thumbnailUrl
              ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                )
              : item.type === 'video'
                ? (
                    <>
                      {item.thumbnailUrl
                        ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          )
                        : (
                            <div className="h-full w-full bg-gradient-to-br from-purple-100 to-purple-200" />
                          )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                          <Video className="h-7 w-7 text-purple-600" />
                        </div>
                      </div>
                    </>
                  )
                : item.type === 'audio'
                  ? (
                      <>
                        <div className="h-full w-full bg-gradient-to-br from-green-100 to-green-200" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                            <Music className="h-7 w-7 text-green-600" />
                          </div>
                        </div>
                      </>
                    )
                  : item.type === 'quote' && item.text
                    ? (
                        <div className="flex items-center justify-center p-4">
                          <p className="line-clamp-6 text-center text-sm text-gray-700 italic">
                            "
                            {item.text}
                            "
                          </p>
                        </div>
                      )
                    : (
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${getTypeColor(item.type)}`}>
                          {getIcon(item.type)}
                        </div>
                      )}

            {/* Duration badge */}
            {item.duration && (
              <div className="bg-opacity-75 absolute right-2 bottom-2 rounded bg-black px-2 py-1 text-xs text-white">
                {formatDuration(item.duration)}
              </div>
            )}

            {/* Hover overlay */}
            <div className="bg-opacity-0 group-hover:bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all group-hover:opacity-100">
              <Button variant="primary" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 flex-1 text-sm font-medium text-gray-900">
                {item.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(selectedId === item.id ? null : item.id);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Meta info */}
            <div className="space-y-1">
              {item.patientName && (
                <p className="text-xs text-gray-600">
                  Patient:
                  {' '}
                  {item.patientName}
                </p>
              )}
              {item.sessionName && (
                <p className="line-clamp-1 text-xs text-gray-600">
                  From:
                  {' '}
                  {item.sessionName}
                </p>
              )}
              <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
            </div>

            {/* Type badge */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getTypeColor(item.type)}`}>
                {getIcon(item.type)}
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
            </div>
          </div>

          {/* Action menu */}
          {selectedId === item.id && (
            <div className="absolute top-12 right-3 z-10 min-w-[150px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Download functionality
                  setSelectedId(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                  setSelectedId(null);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <div className="col-span-full py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mb-2 text-gray-600">No media files yet</p>
          <p className="text-sm text-gray-500">
            Generate or upload media to see it here
          </p>
        </div>
      )}
    </div>
  );
}
