'use client';

import { Download, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
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
  duration?: number;
  text?: string;
  tags?: string[];
  prompt?: string; // AI generation prompt
};

type MediaViewerProps = {
  item: MediaItem;
  onClose: () => void;
};

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

  const handleDownload = async () => {
    if (!item.url) {
      toast.error('No file available to download');
      return;
    }

    try {
      // Get file extension from URL or default based on type
      const urlPath = item.url.split('?')[0]; // Remove query params
      const urlExtension = urlPath.split('.').pop()?.toLowerCase();

      let extension = urlExtension || 'mp4';
      if (!urlExtension) {
        // Default extensions by type
        if (item.type === 'image') extension = 'jpg';
        else if (item.type === 'audio') extension = 'mp3';
        else if (item.type === 'video') extension = 'mp4';
      }

      const filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

      // Download using fetch and blob (works with presigned URLs)
      toast.loading('Downloading...');
      const response = await fetch(item.url);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create temporary anchor and trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      URL.revokeObjectURL(blobUrl);
      toast.dismiss();
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.dismiss();
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white transition-colors hover:text-gray-300"
      >
        <X className="h-8 w-8" />
      </button>

      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto">
        <div className="overflow-hidden rounded-lg bg-white">
          {/* Media Display */}
          <div className="flex max-h-[600px] min-h-[400px] items-center justify-center bg-gray-900">
            {item.type === 'image' && (
              <img
                src={item.url}
                alt={item.title}
                className="max-h-[600px] max-w-full object-contain"
              />
            )}
            {item.type === 'video' && (
              <video
                src={item.url}
                controls
                className="max-h-[600px] max-w-full"
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
                <blockquote className="text-2xl leading-relaxed text-white italic">
                  "
                  {item.text}
                  "
                </blockquote>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Created
                  {' '}
                  {formatDate(item.createdAt)}
                </p>
              </div>
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            {/* Metadata */}
            <div className="mb-6 grid grid-cols-2 gap-4 border-b border-gray-200 pb-6">
              {item.patientName && (
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-700">
                    Patient
                  </p>
                  <p className="text-sm text-gray-900">{item.patientName}</p>
                </div>
              )}
              {item.sessionName && (
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-700">
                    Session
                  </p>
                  <p className="text-sm text-gray-900">{item.sessionName}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900 capitalize">{item.type}</p>
              </div>
              {item.duration && (
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-700">
                    Duration
                  </p>
                  <p className="text-sm text-gray-900">
                    {Math.floor(item.duration / 60)}
                    :
                    {(item.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}
            </div>

            {/* AI Prompt */}
            {item.prompt && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Generation Prompt
                </p>
                <p className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  {item.prompt}
                </p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
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
