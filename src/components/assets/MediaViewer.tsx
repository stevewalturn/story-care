'use client';

import { X, Download, Tag } from 'lucide-react';
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
  duration?: number;
  text?: string;
  tags?: string[];
  prompt?: string; // AI generation prompt
}

interface MediaViewerProps {
  item: MediaItem;
  onClose: () => void;
}

export function MediaViewer({ item, onClose }: MediaViewerProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Media Display */}
          <div className="bg-gray-900 flex items-center justify-center min-h-[400px] max-h-[600px]">
            {item.type === 'image' && (
              <img
                src={item.url}
                alt={item.title}
                className="max-w-full max-h-[600px] object-contain"
              />
            )}
            {item.type === 'video' && (
              <video
                src={item.url}
                controls
                className="max-w-full max-h-[600px]"
              >
                Your browser does not support the video tag.
              </video>
            )}
            {item.type === 'audio' && (
              <div className="w-full max-w-2xl p-8">
                <audio src={item.url} controls className="w-full">
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
            {item.type === 'quote' && item.text && (
              <div className="w-full max-w-2xl p-12 text-center">
                <blockquote className="text-2xl text-white italic leading-relaxed">
                  "{item.text}"
                </blockquote>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Created {formatDate(item.createdAt)}
                </p>
              </div>
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
              {item.patientName && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Patient
                  </p>
                  <p className="text-sm text-gray-900">{item.patientName}</p>
                </div>
              )}
              {item.sessionName && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Session
                  </p>
                  <p className="text-sm text-gray-900">{item.sessionName}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Type</p>
                <p className="text-sm text-gray-900 capitalize">{item.type}</p>
              </div>
              {item.duration && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </p>
                  <p className="text-sm text-gray-900">
                    {Math.floor(item.duration / 60)}:
                    {(item.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}
            </div>

            {/* AI Prompt */}
            {item.prompt && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Generation Prompt
                </p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                  {item.prompt}
                </p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
